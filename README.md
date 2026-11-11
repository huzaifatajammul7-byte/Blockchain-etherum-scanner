# EtherReceipt — React + Express (ek project, ek server)

```
client/   React (Vite) frontend  → build ke baad client/dist banta hai
server/   Express API + static hosting (client/dist ko khud serve karta hai)
```

## Local
```
npm install
npm run build      # frontend build → client/dist
npm start          # http://localhost:3000  (site + API dono)
```
Development (live reload): `npm run dev` → frontend http://localhost:5173, API :3000.

## Features
Wallet connect · ETH/USDC send · payment verify · wallet balance (Ethereum Mainnet + Sepolia)

## Hosting (Render / Railway)
Build: `npm install --include=dev && npm run build` · Start: `npm start` · optional env: see .env.example

## API
GET /api/health · /api/balance · /api/verify
