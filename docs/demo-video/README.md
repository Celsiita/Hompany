# Shipaton demo video assets

Final cut (ready to upload):

- [`HOMPANY-Shipaton-Demo.mp4`](./HOMPANY-Shipaton-Demo.mp4) — ~64 s, 9:16, English TTS VO

Regenerate (Expo web on `:8082`, seeded DB):

```bash
npm run db:reset
npx expo start --web --port 8082
# other terminal:
node scripts/record-shipaton-demo.mjs
powershell -File scripts/generate-demo-voiceover.ps1
powershell -File scripts/mux-shipaton-demo.ps1
```

Shipaton prefers **human voice**. Replace the TTS track or re-narrate over the silent visual if judges care; the picture track alone already covers the script.
