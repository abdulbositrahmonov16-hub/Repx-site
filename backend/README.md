# RepX Store — Backend (FastAPI + MongoDB)

REST API for the RepX store: products CRUD + image upload (saved to the
server's local disk). The React frontend (hosted on Netlify) talks to this
API via `REACT_APP_BACKEND_URL`.

## Requirements
- Python 3.11+
- A MongoDB database (local, or free MongoDB Atlas cluster)

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # then edit .env with your values
```

`.env`:
```
MONGO_URL="mongodb://localhost:27017"        # or your Atlas connection string
DB_NAME="repx_store"
CORS_ORIGINS="https://your-site.netlify.app" # your Netlify domain (comma-separated for many)
```

## Run

```bash
uvicorn server:app --host 0.0.0.0 --port 8001
```

The API is now at `http://localhost:8001`.
On first run the database is auto-seeded with sample products.

## Endpoints (all prefixed with `/api`)
| Method | Path                     | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | `/api/`                  | Health check                   |
| GET    | `/api/products`          | List products (`?category=&subcategory=`) |
| GET    | `/api/products/{id}`     | Get one product                |
| POST   | `/api/products`          | Create product                 |
| PUT    | `/api/products/{id}`     | Update product                 |
| DELETE | `/api/products/{id}`     | Delete product                 |
| POST   | `/api/upload`            | Upload image (multipart `file`) → `{ "url": "/api/uploads/..." }` |
| GET    | `/api/uploads/{file}`    | Serve an uploaded image        |

Uploaded images are stored in `backend/uploads/`. The upload endpoint returns a
relative URL; the frontend prepends `REACT_APP_BACKEND_URL`.

## Deploy (separate host — Render / Railway / Fly.io / VPS)
1. Push this repo to GitHub.
2. Create a Python web service on your host, root = `backend/`.
3. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Set env vars: `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS` (your Netlify URL).
5. **Note on disk storage:** some hosts use an *ephemeral* filesystem — uploaded
   files may be lost on redeploy/restart. For permanent storage use a persistent
   disk/volume, or switch to a cloud store (e.g. Cloudinary/S3).

## Connect the frontend
On Netlify, set the environment variable:
```
REACT_APP_BACKEND_URL=https://your-backend-host.com
```
Then rebuild. (Ask the assistant to switch the frontend data layer from
localStorage to this API once your backend is live.)
