<div align="center">

  <h1>♦️♣️ Lets Play Big Two ♥️♠️</h1>
  
  <p>A multiplayer big two game.</p> 
  
  🚧 Currently under development, there is still a few things <a href="/TODO.md">to do</a> for v1 🚧
</div>

## Local development

Install deps:

```
npm i
```

Setup db tables:

```
npm run db:migrate
```

Start dev server:

```
npm run dev
```

### DB changes

All DB schemas can be found at `/drizzle/schemas`. During development iterations it's ok to use `npm run db:push` to quickly make db changes. Once changes are ready, run `npm run db:generate` to create DB migration file. This will be run when then app deployed.

## Deployment

This application its currently run as a single VM instance on fly.io. Due to way real-time is implemented it can only be scaled vertically! This is a deliberate design decision to keep this whole application self contained on a single node for portability. In theory we could run this on VPS somewhere too!

To manually deploy this app run:

```
fly deploy
```

## Screenshots

...

## Production operations

ssh into the fly VM:

```
fly ssh console
```

if the machine is not run:

```
fly machine start
```

[lazysql](https://github.com/jorgerojas26/lazysql) is preinstalled to make db management easier.

To make DB changes run:

```
lazysql db/store.db
```

## Technologies used

- [Astro](https://astro.build/)
- [React](https://react.dev/)
- [SQLite + Drizzle](https://orm.drizzle.team/docs/get-started-sqlite)
- [Better Auth](https://www.better-auth.com/)
