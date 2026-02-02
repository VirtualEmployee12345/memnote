# MemNote Production Checklist

## Security
- [ ] `ENCRYPTION_KEY` is set and not reused elsewhere.
- [ ] Rate limiting is enabled and configured.
- [ ] `NODE_ENV=production` is set.
- [ ] Redis is not publicly exposed (managed service only).

## Functionality
- [ ] Create note works in production.
- [ ] Read note works in production.
- [ ] Destroy note works in production.
- [ ] Health endpoint returns 200 at `/health`.

## Monitoring
- [ ] Logs show successful startup.
- [ ] Logs show no recurring errors.
- [ ] Health checks are passing in Render.

## Post-launch
- [ ] Share production URL with stakeholders.
- [ ] Set up a basic uptime monitor (optional).
- [ ] Schedule a backup/export plan for notes.
