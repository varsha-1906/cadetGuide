Cadet's Compass Backend (Express + Firebase Admin)

Quick start

1) Install dependencies
   - Open a terminal at the `backend/` directory
   - Run: `npm install`

2) Provide Firebase Admin credentials
   Choose one of the following:
   - Option A (env vars):
     - Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (replace literal newlines in the private key with `\n`).
   - Option B (ADC):
     - Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON file path.

3) Configure allowed frontend origin
   - Set `WEB_ORIGIN` (default `http://127.0.0.1:3002`).

4) Run the API
   - `npm run dev` (or `npm start`)
   - API runs at `http://127.0.0.1:4000`

Endpoints

- `GET /api/health` → health check
- `POST /api/auth/session` → verify a Firebase ID token (Authorization: Bearer <idToken>) and return user
- `GET /api/auth/me` → current user (protected)
- `POST /api/auth/logout` → no-op (client handles sign out)
- `GET /api/mocktests` → sample protected data

Frontend integration notes

- After the user signs in with Firebase on the client, obtain the ID token:
  ```js
  const idToken = await firebase.auth().currentUser.getIdToken();
  const res = await fetch('http://127.0.0.1:4000/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
  });
  ```


