# Railway Test - Task List

Simple task list app to test a Railway deployment with a Postgres backend.

## What it does

Add tasks, check them off, delete them. Everything is stored in Postgres, so
this confirms the app and database are both wired up correctly.

## Deploying on Railway

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. In Railway, click **New Project**, then **Deploy from GitHub repo**, and select this repo.
3. In the same Railway project, click **New**, then **Database**, then **Add PostgreSQL**.
4. Railway automatically sets a `DATABASE_URL` environment variable on your app service pointing to that database. No manual copying needed.
5. Once the deploy finishes, click on the app service and open the generated public URL.

That's it. Every future push to this repo's main branch will auto redeploy.

## Local development (optional)

```
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/tasks npm start
```
