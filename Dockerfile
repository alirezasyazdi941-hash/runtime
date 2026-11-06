# Run the launcher in a container (Node + Python available to uploaded projects).
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv python3-pip git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY launcher ./launcher
ENV LAUNCHER_HOST=0.0.0.0 LAUNCHER_PORT=4000 LAUNCHER_WORKSPACE=/data
VOLUME /data
EXPOSE 4000 4100-4199
# LAUNCHER_TOKEN is mandatory when listening on 0.0.0.0:  docker run -e LAUNCHER_TOKEN=... 
CMD ["node", "launcher/server.mjs"]
