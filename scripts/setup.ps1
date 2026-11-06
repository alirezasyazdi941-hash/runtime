# Ensures Node.js >= 20 is installed on Windows.
$ErrorActionPreference = 'Stop'
function Test-Node {
  $n = Get-Command node -ErrorAction SilentlyContinue
  if (-not $n) { return $false }
  return ([int](& node -p "process.versions.node.split('.')[0]")) -ge 20
}
if (Test-Node) { Write-Host "OK Node $(node -v) found"; exit 0 }
Write-Host "Node.js >= 20 not found - installing..."
if (Get-Command winget -ErrorAction SilentlyContinue) {
  winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
} elseif (Get-Command choco -ErrorAction SilentlyContinue) {
  choco install nodejs-lts -y
} else {
  Write-Host "Install Node.js from https://nodejs.org and re-run."; exit 1
}
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
if (Test-Node) { Write-Host "OK Node $(node -v) ready" } else { Write-Host "Installed - open a NEW terminal and run run.bat again."; exit 1 }
