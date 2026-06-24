# Gift Translate

Gift Translate is now split into a frontend and backend:

- `frontend/`: the Design Component pages and `support.js` runtime.
- `backend/`: a Node HTTP server plus mock document and glossary data.

## Run

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
