# Shipaton demo video

**Final cut:** [`HOMPANY-Shipaton-Demo.mp4`](./HOMPANY-Shipaton-Demo.mp4)

- ~1:42 · 9:16 · ~5 MB
- English UI capture
- Neural English voice (Jenny)
- Title / end cards + lower-third captions

Upload to YouTube/Vimeo as **public**, then paste the link on Devpost.

Regenerate:

```bash
npm run db:reset
npx expo start --web --port 8082
node scripts/record-shipaton-demo.mjs
# voice (once):
# edge-tts clips in audio-hq/ via scripts or prior generation
powershell -File scripts/mux-shipaton-demo.ps1
```

Optional polish for judges: replace the TTS with a human take of the same script.
