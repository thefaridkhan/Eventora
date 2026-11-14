# EventSystem deployment on Koyeb

This repository deploys the React client and Express API together as one Koyeb Web Service. The build creates `client/dist`, and Express serves the frontend along with the `/api` endpoints.

## Koyeb setup

1. In Koyeb, select **Create Web Service** and connect the GitHub repository.
2. Use the **Buildpack** builder with the repository root as the work directory.
3. Set the build command to `npm run build`. Koyeb installs the root dependencies automatically.
4. Leave the run command empty (the repository `Procfile` runs `npm start`) or enter `npm start`.
5. Expose port `8000` with protocol **HTTP** and route `/`.
6. Choose the **Free** instance.

The server reads Koyeb's `PORT` environment variable automatically.

## Required Koyeb environment variables

- `MONGODB_URI` — MongoDB Atlas connection string.
- `JWT_SECRET` — a long random secret.
- `EMAIL_USER` — Gmail address used to send OTP and booking emails.
- `EMAIL_PASS` — a Gmail App Password, not the normal Gmail password.

Never commit these values to GitHub.

## Gmail SMTP

Enable 2-Step Verification on the Gmail account, then generate an App Password named `EventSystem` from the Google Account security settings. Store that generated password as `EMAIL_PASS` in Koyeb.

## Health check

After deployment, open `/api/health` at the Koyeb service URL. A successful response contains `status: "OK"`.
