# Devpost — HOMPANY (Shipaton Next Gen)

Paste into Devpost. Keep links updated after YouTube/Vimeo upload.

## Project name

HOMPANY

## Tagline (≤ ~100 chars)

Stop fighting over chores and money in your student flat.

## Elevator pitch / short description

HOMPANY is a gamified flatmate app for students: shared tasks with photo proof, clear debts, weekly reputation, and a calm flat calendar — so housemates stop arguing and start cooperating.

Built with Expo, Supabase, and RevenueCat (`hompany_plus`).

## Inspiration

Student flats break over tiny things: who cleaned, who paid, who left the sink filthy. Group chats make it worse. HOMPANY turns that into a fair team game with receipts (photo proof), balances you can settle in one tap, and a reputation score that makes freeloading visible without turning toxic.

## What it does

- **Tasks:** assign, swap, complete with photo, approve / dispute
- **Expenses:** equal / % / fixed splits, “you owe / they owe you”, settle
- **Home feed:** flat health %, weekly leaderboard, balances
- **Agenda / Flat life:** calendar, absences, quiet mode, visits, house rules
- **HOMPANY Plus (RevenueCat):** optional packs / matching teaser — core flat tools stay free

## How we built it

- React Native + Expo Router + TypeScript
- Supabase (Postgres, Auth, RLS, Storage)
- RevenueCat purchases + paywall (Test Store / in-app fallback)
- NativeWind UI, Zod validation, Jest tests
- ES/EN i18n for Shipaton judges

## Challenges

Multi-tenant RLS by `home_id`, task lifecycle states, recurring schedules with absences, and making Plus demoable in Expo Go without killing the core free product.

## Accomplishments

- End-to-end demo seed (`ana@hompany.local` / `password123`, invite `DEMO2026`)
- Shipaton demo video cut ≤2 min
- MIT license, public repo, RevenueCat entitlement `hompany_plus`

## What we learned

Judges need a story in 10 seconds: less arguing, photo proof, clear money. Monetization should prove RevenueCat without gating the roommate basics.

## What's next

Roommate matching (Plus), native paywall polish, and shipping beyond the hackathon build.

## Links (fill before submit)

| Field | Value |
|-------|--------|
| **GitHub repo** | https://github.com/Celsiita/Hompany |
| **Demo video** | _(public YouTube/Vimeo URL — upload `docs/demo-video/HOMPANY-Shipaton-Demo.mp4`)_ |
| **Built with** | Expo, React Native, TypeScript, Supabase, RevenueCat, NativeWind |

## Demo credentials (judges / reviewers)

- Email: `ana@hompany.local`
- Password: `password123`
- Invite code: `DEMO2026`

Local setup: see README (`npm install` → `npm run db:start` → `npm run db:reset` → `npm start` + RevenueCat Test Store key).
