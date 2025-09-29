# start-codex.ps1 - bootstrap + test + optional codex
# Flags:
#   -NoCodex   -> bootstrap + tests, skip launching Codex
#   -OnlyTests -> run tests only (assumes env already set up)

param(
  [switch]$NoCodex,
  [switch]$OnlyTests
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Resolve repo root robustly (default + relative probe)
$RepoRoot = "C:\Dev\black-skies"
try {
  if ($PSScriptRoot -and (Test-Path -LiteralPath (Join-Path $PSScriptRoot "..\black-skies"))) {
    $maybe = (Resolve-Path (Join-Path $PSScriptRoot "..\black-skies")).Path
    if (Test-Path $maybe) { $RepoRoot = $maybe }
  }
} catch {}

Set-Location -LiteralPath $RepoRoot

function Ensure-Venv {
  $venvActivate = Join-Path ".\\.venv\\Scripts" "Activate.ps1"
  if (-not (Test-Path -LiteralPath $venvActivate)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
  }
  . $venvActivate
  python -m pip install --upgrade pip setuptools wheel | Out-Null
}

function Install-LockFile {
  param(
    [Parameter(Mandatory=$true)][string]$Path
  )
  if (-not (Test-Path -LiteralPath $Path)) { return }
  Write-Host "Installing locked deps from $Path ..." -ForegroundColor Yellow
  $tmp = New-TemporaryFile
  try {
    Get-Content -LiteralPath $Path | Where-Object {
      $_ -and ($_ -notmatch '^\s*uvloop(\s|=|>|<)')
    } | Set-Content -Encoding UTF8 -LiteralPath $tmp
    pip install --require-virtualenv -r $tmp
  } finally {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force }
  }
}

function Ensure-Python-Tools {
  if (-not (Get-Command pytest -ErrorAction SilentlyContinue)) {
    pip install pytest | Out-Null
  }
  python -m pytest --version | Out-Null
}

function Ensure-Node {
  $node = (node -v) 2>$null
  if (-not $node) { throw "Node.js not found. Install Node 20+." }
  $major = [int]($node.TrimStart('v').Split('.')[0])
  if ($major -lt 20 -and $env:BS_ALLOW_NODE -ne '1') {
    throw "Node $node (<20). Install Node 20+, or set `$env:BS_ALLOW_NODE=1 to override."
  }
}

function Ensure-PnpmShim {
  Write-Host "Ensuring pnpm shim is active..." -ForegroundColor Yellow

  $corepackInstallDir = $env:BS_COREPACK_BIN
  if (-not $corepackInstallDir -and $env:COREPACK_HOME) {
    $corepackInstallDir = Join-Path $env:COREPACK_HOME "shims"
  }
  if (-not $corepackInstallDir) {
    $corepackInstallDir = Join-Path $env:LOCALAPPDATA "Programs/Corepack"
  }

  if (-not (Test-Path -LiteralPath $corepackInstallDir)) {
    New-Item -ItemType Directory -Path $corepackInstallDir | Out-Null
  }

  corepack enable --install-directory $corepackInstallDir | Out-Null
  corepack prepare pnpm@latest --activate | Out-Null

  $candidatePaths = @($corepackInstallDir)
  if ($env:COREPACK_HOME) {
    $candidatePaths += (Join-Path $env:COREPACK_HOME "shims")
    $candidatePaths += $env:COREPACK_HOME
  }
  $candidatePaths += (Join-Path $env:LOCALAPPDATA "node-corepack")

  foreach ($path in $candidatePaths | Where-Object { $_ }) {
    if ((Test-Path -LiteralPath $path) -and -not ($env:PATH -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ -eq $path })) {
      $env:PATH = "$path;$env:PATH"
    }
  }

  if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "pnpm shim not found after Corepack activation (searched $corepackInstallDir)."
  }
}

function Sync-Node {
  Ensure-Node
  Ensure-PnpmShim

  Write-Host "Syncing pnpm workspaces..." -ForegroundColor Yellow
  pnpm install --recursive
}

function Run-Tests {
  Ensure-Node
  Ensure-PnpmShim

  Write-Host "== Python tests (services) ==" -ForegroundColor Cyan
  $svcTests = Join-Path "services" "tests"
  python -m pytest $svcTests -q
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Pytest failed ($svcTests)."
    exit 1
  }

  Write-Host "== Frontend tests (pnpm --filter app test) ==" -ForegroundColor Cyan
  pnpm --filter app test
  if ($LASTEXITCODE -ne 0) {
    Write-Error "pnpm app tests failed."
    exit 1
  }

  Write-Host "All tests passed." -ForegroundColor Green
}

# ---------- Entry Flow ----------

if ($OnlyTests) {
  Ensure-Venv
  Ensure-Python-Tools
  Run-Tests
  exit 0
}

Ensure-Venv
Install-LockFile (Join-Path "." "requirements.lock")
Install-LockFile (Join-Path "." "requirements.dev.lock")
Ensure-Python-Tools
Sync-Node

Run-Tests

if ($NoCodex) {
  Write-Host "Skipping Codex launch (-NoCodex set)." -ForegroundColor Yellow
  exit 0
}

if (Get-Command codex -ErrorAction SilentlyContinue) {
  Write-Host "`nLaunching Codex CLI..." -ForegroundColor Green
  codex --full-auto
} else {
  Write-Warning "Codex CLI not found. Install with: npm install -g @openai/codex"
}

