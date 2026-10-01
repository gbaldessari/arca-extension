# Edge Add-ons package. The store rejects `key` and `background.scripts`.
# Loading this folder for development still uses both: `key` pins the unpacked id,
# and `scripts` is how Firefox loads the background page.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$stage = Join-Path $env:TEMP "arca-edge-pack"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory (Join-Path $stage "icons") | Out-Null

@(
  "background.js", "content.js", "i18n.js", "icons.js",
  "popup.html", "popup.js", "popup.css"
) | ForEach-Object { Copy-Item (Join-Path $root $_) $stage }
Copy-Item (Join-Path $root "icons\*") (Join-Path $stage "icons")

$src = (Join-Path $root "manifest.json").Replace("\", "/")
$dst = (Join-Path $stage "manifest.json").Replace("\", "/")
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('$src','utf8')); delete m.key; delete m.background.scripts; fs.writeFileSync('$dst', JSON.stringify(m, null, 2) + '\n');"

$outDir = Join-Path $root "store"
New-Item -ItemType Directory -Force $outDir | Out-Null
$zipPath = Join-Path $outDir "Arca.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem $stage -Recurse -File | ForEach-Object {
    $name = $_.FullName.Substring($stage.Length + 1).Replace("\", "/")
    $entry = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
    $input = [System.IO.File]::OpenRead($_.FullName)
    try {
      $output = $entry.Open()
      try { $input.CopyTo($output) } finally { $output.Dispose() }
    } finally { $input.Dispose() }
  }
} finally { $zip.Dispose() }

Write-Output $zipPath
