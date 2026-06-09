# Sentry Integration Guide for STRYK

This guide explains how to configure Sentry for both the Next.js frontend (Vercel) and FastAPI backend (Railway).

---

## 1. Next.js Frontend Configuration (Vercel)

For frontend tracking, React rendering errors, client-side crashes, and edge/server route exceptions, you need to configure the following environment variables in your **Vercel Project Settings**:

### Environment Variables

| Variable Name | Type | Value / Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SENTRY_DSN` | Plaintext | The public Sentry DSN key provided by your Sentry project dashboard. Exposes the DSN to client-side code. |
| `SENTRY_AUTH_TOKEN` | Plaintext | A Sentry developer auth token used by the build compiler to upload source maps to Sentry for readable stack traces. |

### Steps to Configure in Vercel:
1. Navigate to your project on the **Vercel Dashboard**.
2. Go to **Settings** -> **Environment Variables**.
3. Add `NEXT_PUBLIC_SENTRY_DSN` with the value from your Sentry Next.js project.
4. Add `SENTRY_AUTH_TOKEN` (select **Sensitive** option to protect it).
5. Trigger a new deployment to apply. Sentry will automatically bundle itself during compile-time!

---

## 2. FastAPI Backend Configuration (Railway)

For backend FastAPI exceptions, database errors, and profile creation/Cloudinary failures, you need to configure the Sentry SDK environment variables in **Railway**:

### Environment Variables

| Variable Name | Value / Purpose |
| :--- | :--- |
| `SENTRY_DSN` | The backend Sentry project DSN key. |
| `APP_ENV` | Sets the Sentry environment tag (e.g. `production`, `staging`, `development`). |

### Steps to Configure in Railway:
1. Go to your **Railway Project Dashboard**.
2. Select your FastAPI service block.
3. Click on the **Variables** tab.
4. Add a new variable `SENTRY_DSN` with your backend Sentry DSN.
5. Add `APP_ENV` with `production` (or `staging`).
6. Railway will automatically redeploy the service and initialize Sentry during application startup!

---

## 3. Local Verification

To verify that the integration is working, start both servers locally:
1. FastAPI: `uvicorn app.main:app --reload`
2. Next.js: `npm run dev`

Visit: `http://localhost:3000/sentry-test`

You will see diagnostic buttons to trigger client-side, server-side route, and backend Python exceptions manually to confirm that Sentry receives the events in real time.
