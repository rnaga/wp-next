# Docker example (Admin Dashboard)

This folder contains a small example showing how to run the wp-next Admin Dashboard in Docker using the provided `docker-compose.yml` and helper `run.sh` script.

This example currently targets macOS arm64 (Apple Silicon) and produces arm64 Linux images. amd64 builds are not supported by this example.

## docker-compose

1. From this `examples/docker` directory, make `run.sh` executable (if needed):

   ```bash
   chmod +x run.sh
   ```

2. Start the example with the helper script (this will use `docker compose` and the local `docker-compose.yml`):

   ```bash
   ./run.sh
   ```

3. The compose file will start the containers and map ports as configured in `docker-compose.yml`. Check the compose file for port mappings (for example, ports exposed for the web UI and the database).

## Run with Docker CLI

Run a single container with the Docker CLI:

```bash
docker run --rm --init -it --name wp-next-example \
-p 3000:3000 \
-v public:/app/admin/public \
-v db:/var/lib/mysql  \
rnagat/wp-next-example:latest
```
