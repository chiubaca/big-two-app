Astro uses `import.meta` for access envs (https://docs.astro.build/en/guides/environment-variables/#getting-environment-variables). However it does not seem to work as expected when deployed to fly.io...

Current observations:

- Using `process.env` works ok in a server side context, it even injects envs that were set in `fly.toml`
- `process.env` does not work in a client-side context. e.g in `src/libs/hono-actions/index.ts` (this is the client-side rpc handler). Using `process.env` here results in a runtime error `process is not defined`. Using `import.meta` works, but `fly.toml` envs are ignored. The workaround for this is set the envs again in the `Dockerfile`.
