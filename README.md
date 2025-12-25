# Cyrus — Web of Trust Identity

A Telegram Mini App for building sybil-resistant identity through real-world vouching.

## How It Works

1. **Show your QR code** to someone you know in person
2. **They scan it** to vouch that you're a real human
3. **Your trust score** = number of people who vouch for you

No passwords. No KYC. Just humans vouching for humans.

## Use Cases

- **VPNs/Proxies**: Only allow verified humans to prevent bot abuse
- **Online communities**: Filter trolls and fake accounts
- **Coordination tools**: Ensure participants are real people

## Quick Start

```bash
npm install
npm run dev
```

## Deploy

1. Fork this repo
2. Create a [Supabase](https://supabase.com) project with a `vouches` table:
   ```sql
   create table vouches (
     id uuid default gen_random_uuid() primary key,
     from_id text not null,
     to_id text not null,
     created_at timestamp default now(),
     unique(from_id, to_id)
   );
   ```
3. Deploy to [Vercel](https://vercel.com) with env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and set the Mini App URL

## API

Verify a user's trust level:

```
GET /api/verify?id=<telegram_user_id>

Response:
{
  "id": "123456",
  "vouch_count": 7,
  "trust_level": "TRUSTED",
  "verified": true
}
```

Trust levels: `UNVERIFIED` (0) → `KNOWN` (1+) → `TRUSTED` (5+) → `VERIFIED_HUMAN` (10+)

## Stack

- React + Vite
- Telegram Mini App SDK
- TON Connect (wallet integration)
- Supabase (database)

## License

MIT

