# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.11.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Astro"

# Install sqlite3 CLI and lazysql dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y sqlite3 git ca-certificates wget && \
    wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz && \
    export PATH=$PATH:/usr/local/go/bin && \
    go install github.com/jorgerojas26/lazysql@latest && \
    mv /root/go/bin/lazysql /usr/local/bin/ && \
    apt-get remove -y git wget && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /root/go go1.22.0.linux-amd64.tar.gz

# Add Go binary directory to PATH
ENV PATH="/usr/local/go/bin:${PATH}"

# Astro app lives here
WORKDIR /app

# Set PUBLIC production environment variables
ENV NODE_ENV="production"
ENV PUBLIC_BASE_URL="https://big-two.fly.dev"
ENV PUBLIC_VAPID_KEY="BD6k74fq6RuDhlenC2JVHVUA9FF6ubj5APkUqPi-IhR64VHqYmt1U-zbP_EzEJHNEZfo5BZsjPa80DG2fXmQapk"

# Define build arguments for private keys
ARG VAPID_PRIVATE_KEY
ARG BETTER_AUTH_SECRET

# Set environment variables using build arguments
ENV VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY .npmrc package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

# Copy ORM files
COPY --from=build /app/drizzle /app/drizzle

# Copy package.json and package-lock.json
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/package-lock.json /app/package-lock.json

# Set environment variables
ENV PORT=4321
ENV HOST=0.0.0.0

# Start the server by default, this can be overwritten at runtime
EXPOSE 4321

# Run migrations and then start the server
CMD [ "sh", "-c", "npm run db:migrate && node ./dist/server/entry.mjs" ]