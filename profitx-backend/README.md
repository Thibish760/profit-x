# ProfitX Backend

Express + TypeScript backend for the ProfitX mobile app.

## Features

- JSON file persistence (`data/app-data.json`)
- Auth endpoint for app login
- Shop settings endpoint
- Finance vendors and payment tracking endpoints
- Saving cards and deposit tracking endpoints

## 1) Install

```bash
cd profitx-backend
npm install
```

## 2) Run in dev mode

```bash
npm run dev
```

Server starts at `http://localhost:4000` by default.

## 3) Build + run

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

- `PORT`: API port (default `4000`)
- `CORS_ORIGIN`: Allowed origin for browser clients (default `*`)
- `APP_SECRET`: Secret used for login token generation

## Default Login

- Email: `admin@profitx.local`
- Password: `admin123`

## API Endpoints

Base URL: `http://localhost:4000/api`

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /settings/shop`
- `PUT /settings/shop`
- `GET /finance/vendors`
- `GET /finance/summary`
- `POST /finance/vendors`
- `PATCH /finance/vendors/:id`
- `POST /finance/vendors/:id/payments`
- `GET /saving/cards`
- `GET /saving/summary`
- `POST /saving/cards`
- `PATCH /saving/cards/:id`
- `POST /saving/cards/:id/deposits`

## Expo App Connection Notes

For a physical device, set your API base URL to your computer LAN IP (not `localhost`):

- Example: `http://192.168.1.50:4000/api`

For Android emulator, use:

- `http://10.0.2.2:4000/api`

For iOS simulator, `localhost` works:

- `http://localhost:4000/api`
