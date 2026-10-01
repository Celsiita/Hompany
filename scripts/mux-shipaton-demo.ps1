# High-quality Shipaton mux: title cards + neural VO + captions + phone capture
$ErrorActionPreference = 'Stop'
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

$root = Resolve-Path (Join-Path $PSScriptRoot '..\docs\demo-video')
$raw = Join-Path $root 'raw-capture.webm'
$audioDir = Join-Path $root 'audio-hq'
$voiceTrack = Join-Path $root 'voiceover-hq.wav'
$cardsDir = Join-Path $root 'cards'
$final = Join-Path $root 'HOMPANY-Shipaton-Demo.mp4'
$ass = Join-Path $root 'captions.ass'

New-Item -ItemType Directory -Force -Path $cardsDir | Out-Null

# --- Title / end cards (dark teal brand, no purple) ---
function New-Card($name, $title, $sub, $seconds) {
  $out = Join-Path $cardsDir $name
  & ffmpeg -y -f lavfi -i "color=c=0x0F3D3E:s=720x1600:d=${seconds}" `
    -vf "drawtext=fontfile=/Windows/Fonts/segoeuib.ttf:text='$title':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=h*0.38,drawtext=fontfile=/Windows/Fonts/segoeui.ttf:text='$sub':fontcolor=0xD7EDEA:fontsize=34:x=(w-text_w)/2:y=h*0.48" `
    -c:v libx264 -pix_fmt yuv420p -t $seconds $out
  if ($LASTEXITCODE -ne 0) { throw "card $name failed" }
}

Write-Output 'Cards…'
New-Card 'intro.mp4' 'HOMPANY' 'Stop arguing about chores and money' 3.2
New-Card 'outro.mp4' 'HOMPANY' 'Expo  ·  Supabase  ·  RevenueCat' 3.0

# --- Timed VO (Jenny neural), advantage-first beat sheet ---
$clips = @(
  @{ file = '01-intro.mp3'; at = 3.5 },
  @{ file = '02-feed.mp3'; at = 14.0 },
  @{ file = '02b-alerts.mp3'; at = 26.0 },
  @{ file = '03b-reminders.mp3'; at = 38.0 },
  @{ file = '03-tasks.mp3'; at = 46.0 },
  @{ file = '04-expenses.mp3'; at = 62.0 },
  @{ file = '05-plus.mp3'; at = 80.0 },
  @{ file = '06-outro.mp3'; at = 92.0 }
)

$n = $clips.Count
$inputs = @()
$filterParts = @()
$mixInputs = @()
for ($i = 0; $i -lt $n; $i++) {
  $path = Join-Path $audioDir $clips[$i].file
  $inputs += @('-i', $path)
  $delayMs = [int]([double]$clips[$i].at * 1000)
  $filterParts += "[${i}:a]adelay=${delayMs}|${delayMs},volume=1.2[a$i]"
  $mixInputs += "[a$i]"
}
$filter = ($filterParts -join ';') + ';' + ($mixInputs -join '') + "amix=inputs=${n}:dropout_transition=0:normalize=0,alimiter=limit=0.95[aout]"

Write-Output 'Voice mix…'
& ffmpeg -y @inputs -filter_complex $filter -map '[aout]' -ac 1 -ar 44100 $voiceTrack
if ($LASTEXITCODE -ne 0) { throw 'voice mix failed' }

# Soft ASS captions (lower-third)
@'
[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1600

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Segoe UI,42,&H00FFFFFF,&H000000FF,&H80000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,40,40,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:03.50,0:00:11.00,Default,,0,0,0,,Fewer arguments. More clarity.
Dialogue: 0,0:00:14.00,0:00:24.00,Default,,0,0,0,,Flat health, ranking, and balances.
Dialogue: 0,0:00:26.00,0:00:36.00,Default,,0,0,0,,Alerts for overdue, review, and money.
Dialogue: 0,0:00:38.00,0:00:44.00,Default,,0,0,0,,Deadlines on every card.
Dialogue: 0,0:00:46.00,0:00:58.00,Default,,0,0,0,,Photo proof. No chore debates.
Dialogue: 0,0:01:02.00,0:01:14.00,Default,,0,0,0,,Who owes whom - one tap.
Dialogue: 0,0:01:20.00,0:01:30.00,Default,,0,0,0,,Plus via RevenueCat. Matching soon.
Dialogue: 0,0:01:32.00,0:01:42.00,Default,,0,0,0,,Expo - Supabase - RevenueCat
'@ | Set-Content -Encoding ASCII $ass

Write-Output 'Assemble final…'
$intro = Join-Path $cardsDir 'intro.mp4'
$outro = Join-Path $cardsDir 'outro.mp4'
$assEsc = $ass.Replace('\', '/').Replace(':', '\:')

# Normalize raw phone capture, concat with cards, burn captions, mux VO
& ffmpeg -y `
  -i $intro -i $raw -i $outro -i $voiceTrack `
  -filter_complex @"
[0:v]fps=30,format=yuv420p,setsar=1[v0];
[1:v]scale=720:1600:force_original_aspect_ratio=decrease,pad=720:1600:(ow-iw)/2:(oh-ih)/2:color=0xF7F4EF,fps=30,format=yuv420p,setsar=1[v1];
[2:v]fps=30,format=yuv420p,setsar=1[v2];
[v0][v1][v2]concat=n=3:v=1:a=0[vcat];
[vcat]ass='${assEsc}'[vout]
"@ `
  -map '[vout]' -map 3:a `
  -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 160k `
  -shortest -movflags +faststart `
  $final

if ($LASTEXITCODE -ne 0) { throw 'final mux failed' }

$dur = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $final
$size = (Get-Item $final).Length
Write-Output "DONE $final  ${dur}s  $([math]::Round($size/1MB,2))MB"
