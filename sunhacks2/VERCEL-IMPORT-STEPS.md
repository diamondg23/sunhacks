Vercel import checklist (from `serverless` branch)

1. Go to https://vercel.com and sign in with GitHub.
2. Click "New Project" → "Import Git Repository" and select `diamondg23/sunhacks`.
3. In the import settings:
   - Branch: `serverless`
   - Root Directory: `sunhacks2`
4. Finish import. Once project is created, go to Project Settings → Environment Variables.
5. Add the following variables (Preview + Production):
   - UPSTASH_REDIS_REST_URL = https://<your-upstash-rest-url>
   - UPSTASH_REDIS_REST_TOKEN = <your-upstash-token>
6. After saving env vars, click "Deploy" or wait for Vercel to automatically redeploy.
7. Open the deployment URL, register a username, and test messaging from multiple devices.

If you need to redeploy after changes, push to the `serverless` branch and Vercel will detect and create a new deployment.
