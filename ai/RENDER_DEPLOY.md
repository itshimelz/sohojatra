## Deploy AI Module on Render (Docker Image)

This guide is for deploying only the AI service.

### 1) Build and push image

From project root:

```bash
docker build -t ghcr.io/<user>/sohojatra-ai:latest ./ai
docker push ghcr.io/<user>/sohojatra-ai:latest
```

Use a version tag for releases (`:v1.0.0`) in addition to `:latest`.

### 2) Create Render service

1. Render -> New -> Web Service -> **Deploy an existing image**
2. Image: `ghcr.io/<user>/sohojatra-ai:latest`
3. Add private registry credentials (username + token)
4. Set:
   - Health Check Path: `/health`
   - Auto Deploy: optional (recommended only with pinned tags strategy)

### 3) Environment variables

Use `ai/.env.render.example` as your source of required variables.

Minimum required to serve `/analyze`:
- `APP_ENV`
- `LOG_LEVEL`
- `BANGLABERT_MODEL`
- `MODAL_API_URL` (or local fallback logic)

Recommended for full feature set:
- `DATABASE_URL` and/or `AI_DATABASE_URL`
- `REDIS_URL`
- `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`

### 4) Port and startup

The Dockerfile starts with:

```bash
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}
```

Render provides `PORT` automatically.

### 5) Connect your web app

Set your main web app environment variable:

```env
RAILWAY_AI_URL=https://<your-render-service>.onrender.com
```

(`RAILWAY_AI_URL` naming can remain unchanged; value should be Render URL.)

### 6) Smoke checks

After deploy:

```bash
curl https://<your-render-service>.onrender.com/health
curl -X POST https://<your-render-service>.onrender.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"রাস্তার ড্রেন ভেঙে গেছে","user_id":"smoke"}'
```
