# Gift Translate

Gift Translate is now split into a frontend and backend:

- `frontend/`: the Design Component pages and `support.js` runtime.
- `backend/`: a Node HTTP server plus mock document and glossary data.

## Run

Oxford lookup uses the official Oxford Dictionaries API. Create `.env` from the example and fill in your credentials:

```bash
copy .env.example .env
```

Required variables:

- `OXFORD_APP_ID`
- `OXFORD_APP_KEY`
- `OXFORD_LANGUAGE` defaults to `en-us`

When Oxford credentials are missing or unavailable, lookup falls back to the local glossary.

```bash
npm start
```

Then open:

- App: `http://127.0.0.1:3000/`
- Guide: `http://127.0.0.1:3000/guide`

## API

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/docs`
- `GET /api/docs/:id`
- `GET /api/lookup?q=token`
- `GET /api/terms`
- `GET /api/terms/:id`
- `GET /api/session`
- `POST /api/session`
