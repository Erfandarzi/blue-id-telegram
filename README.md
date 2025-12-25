# Blue ID - Telegram Mini App

A minimal Telegram Mini App for claiming Soulbound Identity Tokens on TON blockchain.

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

## Deploy to Vercel

1. Push this folder to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Deploy (no config needed)
4. Copy your Vercel URL

## Setup Telegram Bot

1. Open Telegram → message `@BotFather`
2. Send `/newbot` and follow prompts
3. Send `/newapp` → select your bot
4. Paste your Vercel URL as the Web App URL

## Update Manifest

After deploying, update these files with your actual Vercel URL:
- `src/main.jsx` - line 7 (manifestUrl)
- `public/tonconnect-manifest.json` - url field

## Next Steps

- Add real SBT minting (see TON docs for contract)
- Add backend verification
- Configure USDT airdrops for holders

