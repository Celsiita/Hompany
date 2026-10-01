# Generates English voiceover WAV clips for the Shipaton demo (Windows SAPI).
$ErrorActionPreference = 'Stop'
$outDir = Join-Path $PSScriptRoot '..\docs\demo-video\audio'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100

# Prefer a clear English voice if installed
$voices = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo }
$en = $voices | Where-Object { $_.Culture.Name -like 'en-*' } | Select-Object -First 1
if ($en) { $synth.SelectVoice($en.Name) }

$lines = @(
  @{ file = '01-intro.wav'; text = 'HOMPANY: for student flatshares. Fewer arguments, more clarity.' },
  @{ file = '02-feed.wav'; text = 'See if the flat is on track, and who is keeping up.' },
  @{ file = '03-tasks.wav'; text = 'Finish chores with a photo. No fights about whether you did it.' },
  @{ file = '04-expenses.wav'; text = 'Who owes whom, in one tap.' },
  @{ file = '05-plus.wav'; text = 'Plus is wired with RevenueCat. Matching is coming soon.' },
  @{ file = '06-outro.wav'; text = 'Built with Expo, Supabase, and RevenueCat. Thanks for watching.' }
)

foreach ($line in $lines) {
  $path = Join-Path $outDir $line.file
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($line.text)
  $synth.SetOutputToNull()
  Write-Output "Wrote $path"
}

$synth.Dispose()
Write-Output 'TTS done'
