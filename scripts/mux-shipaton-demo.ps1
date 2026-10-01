# Mux Shipaton demo: raw WebM + timed English VO → final MP4 ≤2 min
$ErrorActionPreference = 'Stop'
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

$root = Resolve-Path (Join-Path $PSScriptRoot '..\docs\demo-video')
$raw = Join-Path $root 'raw-capture.webm'
$audioDir = Join-Path $root 'audio'
$voiceTrack = Join-Path $root 'voiceover-timed.wav'
$final = Join-Path $root 'HOMPANY-Shipaton-Demo.mp4'
$finalVertical = Join-Path $root 'HOMPANY-Shipaton-Demo-9x16.mp4'

# Start times (seconds) aligned to a ~69s capture of the demo script
$clips = @(
  @{ file = '01-intro.wav'; at = 0.4 },
  @{ file = '02-feed.wav'; at = 9.0 },
  @{ file = '03-tasks.wav'; at = 24.0 },
  @{ file = '04-expenses.wav'; at = 38.0 },
  @{ file = '05-plus.wav'; at = 48.0 },
  @{ file = '06-outro.wav'; at = 58.5 }
)

$n = $clips.Count
$inputs = @('-i', $raw)
$filterParts = @()
$mixInputs = @()
for ($i = 0; $i -lt $n; $i++) {
  $path = Join-Path $audioDir $clips[$i].file
  $inputs += @('-i', $path)
  $delayMs = [int]([double]$clips[$i].at * 1000)
  # index i+1 because 0 is video
  $filterParts += "[$($i + 1):a]adelay=${delayMs}|${delayMs},volume=1.15[a$i]"
  $mixInputs += "[a$i]"
}
$filter = ($filterParts -join ';') + ';' + ($mixInputs -join '') + "amix=inputs=${n}:dropout_transition=0:normalize=0[aout]"

Write-Output 'Building timed voiceover…'
& ffmpeg -y @inputs -filter_complex $filter -map '[aout]' -ac 1 -ar 44100 $voiceTrack
if ($LASTEXITCODE -ne 0) { throw 'voiceover mix failed' }

Write-Output 'Muxing final MP4…'
# Phone capture → clean H.264 + AAC; pad to 9:16 safe; keep under 2 minutes
& ffmpeg -y -i $raw -i $voiceTrack `
  -filter_complex "[0:v]scale=720:1600:force_original_aspect_ratio=decrease,pad=720:1600:(ow-iw)/2:(oh-ih)/2:color=0xF7F4EF,fps=30,format=yuv420p[v]" `
  -map '[v]' -map 1:a `
  -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 128k `
  -shortest -movflags +faststart `
  $finalVertical

Copy-Item -Force $finalVertical $final

$dur = & ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 $final
$size = (Get-Item $final).Length
Write-Output "DONE path=$final duration=${dur}s size=$([math]::Round($size/1MB,2))MB"
