// Zero-dependency ZIP extractor (stored + deflate) with zip-slip and zip-bomb protection.
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const inflateRaw = promisify(zlib.inflateRaw);

export const LIMITS = {
  maxEntries: 50_000,
  maxEntryBytes: 1024 ** 3,
  maxTotalBytes: 2 * 1024 ** 3,
};

const SKIP = (name) =>
  name.startsWith('__MACOSX/') || name.endsWith('.DS_Store') || name === '.git' || name.startsWith('.git/');

export function safeEntryPath(destDir, rawName) {
  const name = rawName.replace(/\\/g, '/').replace(/^\/+/, '');
  if (/^[a-zA-Z]:/.test(name) || name.split('/').includes('..') || name.includes('\0')) {
    throw new Error(`Unsafe path in archive: ${rawName}`);
  }
  const root = path.resolve(destDir);
  const target = path.resolve(root, name);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error(`Unsafe path in archive: ${rawName}`);
  }
  return { name, target };
}

export async function extractZip(zipPath, destDir, limits = LIMITS) {
  const fh = await fsp.open(zipPath, 'r');
  try {
    const { size } = await fh.stat();
    if (size < 22) throw new Error('Not a valid ZIP file (too small)');
    const tailLen = Math.min(size, 65_557);
    const tail = Buffer.alloc(tailLen);
    await fh.read(tail, 0, tailLen, size - tailLen);
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Not a valid ZIP file (central directory not found)');

    const total = tail.readUInt16LE(eocd + 10);
    const cdSize = tail.readUInt32LE(eocd + 12);
    const cdOffset = tail.readUInt32LE(eocd + 16);
    if (total === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      throw new Error('ZIP64 archives are not supported. Re-zip with a standard tool.');
    }
    if (total > limits.maxEntries) throw new Error(`Archive has too many entries (${total})`);

    const cd = Buffer.alloc(cdSize);
    await fh.read(cd, 0, cdSize, cdOffset);

    await fsp.mkdir(destDir, { recursive: true });
    let pos = 0, files = 0, bytes = 0;

    for (let n = 0; n < total; n++) {
      if (cd.readUInt32LE(pos) !== 0x02014b50) throw new Error('Corrupt ZIP central directory');
      const flags = cd.readUInt16LE(pos + 8);
      const method = cd.readUInt16LE(pos + 10);
      const crc = cd.readUInt32LE(pos + 16);
      const compSize = cd.readUInt32LE(pos + 20);
      const rawSize = cd.readUInt32LE(pos + 24);
      const nameLen = cd.readUInt16LE(pos + 28);
      const extraLen = cd.readUInt16LE(pos + 30);
      const commentLen = cd.readUInt16LE(pos + 32);
      const extAttr = cd.readUInt32LE(pos + 38);
      const localOffset = cd.readUInt32LE(pos + 42);
      const rawName = cd.toString('utf8', pos + 46, pos + 46 + nameLen);
      pos += 46 + nameLen + extraLen + commentLen;

      if (SKIP(rawName.replace(/\\/g, '/'))) continue;
      if (flags & 1) throw new Error('Encrypted ZIP entries are not supported');
      const { name, target } = safeEntryPath(destDir, rawName);
      if (name === '' ) continue;
      if (name.endsWith('/')) { await fsp.mkdir(target, { recursive: true }); continue; }
      if (((extAttr >>> 16) & 0xf000) === 0xa000) continue; // never materialise symlinks
      if (rawSize > limits.maxEntryBytes) throw new Error(`Entry too large: ${name}`);
      bytes += rawSize;
      if (bytes > limits.maxTotalBytes) throw new Error('Archive exceeds the maximum extracted size');

      const lh = Buffer.alloc(30);
      await fh.read(lh, 0, 30, localOffset);
      if (lh.readUInt32LE(0) !== 0x04034b50) throw new Error('Corrupt ZIP local header');
      const dataStart = localOffset + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28);
      const comp = Buffer.alloc(compSize);
      if (compSize) await fh.read(comp, 0, compSize, dataStart);

      let data;
      if (method === 0) data = comp;
      else if (method === 8) data = await inflateRaw(comp, { maxOutputLength: rawSize + 1 });
      else throw new Error(`Unsupported compression method ${method} for ${name}`);
      if (data.length !== rawSize) throw new Error(`Size mismatch for ${name}`);
      if (typeof zlib.crc32 === 'function' && zlib.crc32(data) !== crc) throw new Error(`CRC mismatch for ${name}`);

      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.writeFile(target, data, { mode: (extAttr >>> 16) & 0o100 ? 0o755 : 0o644 });
      files++;
    }
    return { files, bytes };
  } finally {
    await fh.close();
  }
}

/** If dir contains exactly one directory (and nothing meaningful else), hoist its content up. */
export async function flattenSingleRoot(dir) {
  const entries = (await fsp.readdir(dir)).filter((e) => e !== '__MACOSX' && e !== '.DS_Store');
  if (entries.length !== 1) return;
  const inner = path.join(dir, entries[0]);
  if (!(await fsp.stat(inner)).isDirectory()) return;
  const tmp = `${dir}.__flat`;
  await fsp.rename(inner, tmp);
  for (const e of await fsp.readdir(dir)) await fsp.rm(path.join(dir, e), { recursive: true, force: true });
  for (const e of await fsp.readdir(tmp)) await fsp.rename(path.join(tmp, e), path.join(dir, e));
  await fsp.rm(tmp, { recursive: true, force: true });
}
