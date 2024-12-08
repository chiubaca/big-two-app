# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.11.1
FROM node:${NODE_VERSION}-slim as base
FROM flyio/flyctl:latest as flyio
FROM debian:bullseye-slim

RUN apt-get update; apt-get install -y ca-certificates jq

COPY <<"EOF" /srv/deploy.sh
#!/bin/bash
deploy=(flyctl deploy)
touch /srv/.secrets

while read -r secret; do
  echo "export ${secret}=${!secret}" >> /srv/.secrets
  deploy+=(--build-secret "${secret}=${!secret}")
done < <(flyctl secrets list --json | jq -r ".[].Name")

deploy+=(--build-secret "ALL_SECRETS=$(base64 --wrap=0 /srv/.secrets)")
${deploy[@]}
EOF

RUN chmod +x /srv/deploy.sh

COPY --from=flyio /flyctl /usr/bin

LABEL fly_launch_runtime="Astro"

# Astro app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Note: You can mount multiple secrets
RUN --mount=type=secret,id=ALL_SECRETS \
    eval "$(base64 -d /run/secrets/ALL_SECRETS)"


# Install node modules
COPY .npmrc package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code, ignoring the pocketbase directory
COPY . .
RUN rm -rf /app/pocketbase

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

ENV PORT=4321
ENV HOST=0.0.0.0

# Start the server by default, this can be overwritten at runtime
EXPOSE 4321
CMD [ "node", "./dist/server/entry.mjs" ]
