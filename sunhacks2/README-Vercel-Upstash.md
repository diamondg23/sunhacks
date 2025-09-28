Deploying sunhacks2 to Vercel with Upstash Redis

This folder has been converted to serverless endpoints that use Upstash Redis for storage. Deploying to Vercel will serve static files from `public/` and serverless functions from `api/`.

Required env vars on Vercel:
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Steps:
1. Create an Upstash Redis instance and copy the REST URL and token.
2. Create a new Vercel project connected to this repository (select the repo and `serverless` branch if you prefer).
3. Add the two environment variables above in the Vercel dashboard.
4. Deploy. The site will be available at your Vercel URL. The static client will call `/api/*` endpoints automatically.

Notes:
- This is a minimal, unauthenticated demo. Do not use in production without authentication and validation.
- The API uses lists in Redis for inbox and history; messages persist across deployments as long as the Upstash instance remains.
