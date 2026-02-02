# Render Deployment Guide (MemNote)

## Prerequisites
- GitHub repository for MemNote (already created).
- Render.com account with access to the repo.

## Step-by-step deployment
1. Push latest changes to GitHub.
2. Log in to Render.
3. Click **New** → **Blueprint**.
4. Select the MemNote GitHub repo.
5. Render detects `render.yaml`. Review the services.
6. Click **Apply** to create the Web Service and Redis.
7. Wait for the build and deploy to complete.

## Environment variables
- Render will auto-generate `ENCRYPTION_KEY` from the blueprint.
- `NODE_ENV` is set to `production`.
- `REDIS_URL` is wired automatically from the Redis service.

To edit or add variables later:
1. Open the web service in Render.
2. Go to **Environment**.
3. Add or update variables and save.
4. Trigger a new deploy if needed.

## Verify deployment
1. Open the Render web service URL.
2. Hit the health endpoint: `https://<your-service>.onrender.com/health`.
3. Perform a quick app check:
   - Create a note
   - Read the note
   - Destroy the note

## Troubleshooting tips
- **Build fails**: Check `package.json` has `npm start` script and dependencies installed.
- **App crashes**: Inspect Render logs for stack traces and missing env vars.
- **Redis issues**: Ensure `REDIS_URL` exists and the Redis service is running.
- **Health check failing**: Confirm the `/health` route responds with 200.
