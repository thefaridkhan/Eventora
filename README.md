# EventSystem deployment on Render

This repository deploys the React client and Express API together as one Render Web Service. The build creates `client/dist`, and Express serves the frontend along with the `/api` endpoints.

## Deploy on Render

1. In Render, select **New** > **Blueprint** and select the GitHub repository.
2. Render reads `render.yaml` and creates the `event-system` Web Service.
3. During setup, provide values for the environment variables listed below.
4. Click **Apply** to deploy. Open the service URL after the deployment succeeds.

## Required environment variables

- `MONGODB_URI` — MongoDB Atlas connection string.
- `BREVO_API_KEY` — Brevo API key with Transactional email permission.
- `BREVO_SENDER_EMAIL` — the verified sender email address in Brevo.

Render generates `JWT_SECRET` automatically. Never commit any of these secret values to GitHub.

## Brevo email setup

1. In Brevo, add and verify a sender email address.
2. Create an API key with Transactional email access.
3. Set the verified email address as `BREVO_SENDER_EMAIL` and the API key as `BREVO_API_KEY` in Render.

The application sends OTP and booking confirmation emails through Brevo's HTTPS API. This avoids the SMTP port limitation on Render's free web service.

## Health check

After deployment, open `/api/health` at the Render service URL. A successful response contains `status: "OK"`.
