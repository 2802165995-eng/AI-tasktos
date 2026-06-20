$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$packageScript = Join-Path $PSScriptRoot "package-aliyun-fc.ps1"

& $packageScript

$zipPath = Join-Path $root "dist\tasteos-aliyun-fc.zip"
if (-not (Test-Path -LiteralPath $zipPath)) {
  throw "Deployment ZIP was not created: $zipPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

try {
  $entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace("\", "/") })
  $required = @(
    "index.html",
    "README.md",
    "scripts/static-server.js",
    "scripts/openai-analysis.mjs",
    "src/app.js",
    "src/apiClient.js",
    "src/styles.css"
  )

  foreach ($entry in $required) {
    if ($entries -notcontains $entry) {
      throw "Required ZIP entry missing: $entry"
    }
  }

  $forbiddenPatterns = @(
    "^\.env\.local$",
    "^\.git/",
    "^\.github/",
    "^\.worktrees/",
    "^docs/",
    "\.test\.mjs$",
    "\.log$",
    "\.pdf$",
    "\.docx$",
    "aipm_resume"
  )

  foreach ($entry in $entries) {
    foreach ($pattern in $forbiddenPatterns) {
      if ($entry -match $pattern) {
        throw "Forbidden ZIP entry found: $entry"
      }
    }
  }
} finally {
  $archive.Dispose()
}

Write-Output "Aliyun FC package checks passed"
