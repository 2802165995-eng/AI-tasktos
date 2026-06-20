$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$distDirectory = Join-Path $root "dist"
$zipPath = Join-Path $distDirectory "tasteos-aliyun-fc.zip"
$stagingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("tasteos-aliyun-fc-" + [Guid]::NewGuid().ToString("N"))

try {
  New-Item -ItemType Directory -Path $stagingDirectory | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $stagingDirectory "src") | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $stagingDirectory "scripts") | Out-Null

  Copy-Item -LiteralPath (Join-Path $root "index.html") -Destination $stagingDirectory
  Copy-Item -LiteralPath (Join-Path $root "README.md") -Destination $stagingDirectory

  $deploymentGuide = Join-Path $root "DEPLOY_ALIYUN_FC.md"
  if (Test-Path -LiteralPath $deploymentGuide) {
    Copy-Item -LiteralPath $deploymentGuide -Destination $stagingDirectory
  }

  Get-ChildItem -LiteralPath (Join-Path $root "src") -File |
    Where-Object { $_.Extension -in @(".js", ".css") } |
    Copy-Item -Destination (Join-Path $stagingDirectory "src")

  foreach ($scriptName in @("static-server.js", "openai-analysis.mjs")) {
    Copy-Item -LiteralPath (Join-Path $root "scripts\$scriptName") -Destination (Join-Path $stagingDirectory "scripts")
  }

  New-Item -ItemType Directory -Path $distDirectory -Force | Out-Null
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  Compress-Archive -Path (Join-Path $stagingDirectory "*") -DestinationPath $zipPath -CompressionLevel Optimal
  Write-Output $zipPath
} finally {
  if (Test-Path -LiteralPath $stagingDirectory) {
    Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
  }
}
