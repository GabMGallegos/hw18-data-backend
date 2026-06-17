# hw18-data-backend

Backend responsible for data access. This is the only project that connects to MongoDB.

## Environment

Copy `.env.example` to `.env` and configure:

```env
PORT=4010
HOST=0.0.0.0
MONGODB_URI=your-real-mongodb-uri
CORS_ORIGIN=*
```

## Run

```bash
npm install
npm start
```

## Main internal base URL

```text
http://10.0.0.6:4010/data
```
