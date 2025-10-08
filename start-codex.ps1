# start-codex.ps1 - bootstrap + test + optional codex
# Flags:
#   -NoCodex    -> bootstrap + tests, skip launching Codex
#   -OnlyTests  -> run tests only (assumes env already set up)
#   -LaunchGui  -> after tests, launch python -m blackskies.services and pnpm run dev in new windows.
#                  Assumes dependencies are already synchronized above; mirrors the README workflow.
# Usage:
#   powershell.exe -ExecutionPolicy Bypass -File .\start-codex.ps1 [-LaunchGui]
#   (Run the command exactly as shown; do not prefix it with the literal
#    `PS C:\...>` prompt or PowerShell will treat `PS` as the `Get-Process`
#    alias and exit before the script starts.)

param(
  [switch]$NoCodex,
  [switch]$OnlyTests,
  [switch]$LaunchGui,
  [switch]$SmokeTest
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

function Resolve-PowerShellHost {
  param(
    [string[]]$Candidates = @("pwsh.exe", "pwsh", "powershell.exe", "powershell")
  )

  foreach ($candidate in $Candidates) {
    try {
      $command = Get-Command -Name $candidate -ErrorAction Stop
      if ($command -and $command.Source) {
        return $command.Source
      }
    } catch {
      continue
    }
  }

  $searched = [string]::Join(", ", $Candidates)
  throw "Unable to locate a PowerShell executable. Tried: $searched. Install PowerShell 7+ or ensure Windows PowerShell is available."
}

$script:PowerShellHost = Resolve-PowerShellHost

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

function Resolve-ProjectBaseDir {
  $defaultProjectBaseDir = Join-Path $RepoRoot "sample_project"
  $projectBaseDir = $env:BLACKSKIES_PROJECT_BASE_DIR

  if ($projectBaseDir -and (Test-Path -LiteralPath $projectBaseDir)) {
    return $projectBaseDir
  }

  if ($projectBaseDir) {
    Write-Warning "BLACKSKIES_PROJECT_BASE_DIR '$projectBaseDir' does not exist; falling back to $defaultProjectBaseDir"
  } else {
    Write-Host "BLACKSKIES_PROJECT_BASE_DIR not set; defaulting to $defaultProjectBaseDir" -ForegroundColor Yellow
  }

  if (Test-Path -LiteralPath $defaultProjectBaseDir) {
    return $defaultProjectBaseDir
  }

  throw "Project base directory '$projectBaseDir' does not exist and fallback '$defaultProjectBaseDir' was not found. Set BLACKSKIES_PROJECT_BASE_DIR to a valid path."
}

function Run-Tests {
  Ensure-Node
  Ensure-PnpmShim

  $resolvedProjectBaseDir = Resolve-ProjectBaseDir
  $env:BLACKSKIES_PROJECT_BASE_DIR = $resolvedProjectBaseDir
  Write-Host "Using BLACKSKIES_PROJECT_BASE_DIR=$resolvedProjectBaseDir" -ForegroundColor Cyan

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

function Start-ServicesWindow {
  $projectBaseDir = Resolve-ProjectBaseDir
  Write-Host "Using BLACKSKIES_PROJECT_BASE_DIR=$projectBaseDir" -ForegroundColor Cyan

  $env:BLACKSKIES_PROJECT_BASE_DIR = $projectBaseDir

  $pythonExe = Join-Path ".\\.venv\\Scripts" "python.exe"
  if (-not (Test-Path -LiteralPath $pythonExe)) {
    throw "Virtual environment Python executable not found at $pythonExe. Run Ensure-Venv first."
  }

  $serviceCommand = "& `"$pythonExe`" -m blackskies.services"
  Start-Process -FilePath $script:PowerShellHost -ArgumentList "-NoExit", "-Command", $serviceCommand -WorkingDirectory $RepoRoot | Out-Null
}

function Start-RendererWindow {
  Ensure-Node
  Ensure-PnpmShim

  $rendererCommand = "pnpm run dev"
  Start-Process -FilePath $script:PowerShellHost -ArgumentList "-NoExit", "-Command", $rendererCommand -WorkingDirectory $RepoRoot | Out-Null
}

function Start-SmokeViteWindow {
  Ensure-Node
  Ensure-PnpmShim

  $viteCommand = "pnpm --filter app dev -- --host 127.0.0.1 --port 5173"
  Start-Process -FilePath $script:PowerShellHost -ArgumentList "-NoExit", "-Command", $viteCommand -WorkingDirectory $RepoRoot | Out-Null
}

function Start-SmokeElectronWindow {
  param(
    [Parameter(Mandatory=$true)][string]$PythonExe,
    [Parameter(Mandatory=$true)][string]$ProjectBaseDir
  )

  Ensure-Node
  Ensure-PnpmShim

  $electronScript = @"

`$env:ELECTRON_RENDERER_URL = 'http://127.0.0.1:5173/'
`$env:BLACKSKIES_PYTHON = '$PythonExe'
`$env:BLACKSKIES_PROJECT_BASE_DIR = '$ProjectBaseDir'
pnpm --filter app exec electron ..\dist-electron\main\main.js
"@

  Start-Process -FilePath $script:PowerShellHost -ArgumentList "-NoExit", "-Command", $electronScript -WorkingDirectory $RepoRoot | Out-Null
}

# ---------- Entry Flow ----------

if ($OnlyTests) {
  Ensure-Venv
  Ensure-Python-Tools
  Run-Tests
  exit 0
}

if ($SmokeTest) {
  Ensure-Venv
  Install-LockFile (Join-Path "." "requirements.lock")
  Install-LockFile (Join-Path "." "requirements.dev.lock")
  Ensure-Python-Tools
  Sync-Node

  $projectBaseDir = Resolve-ProjectBaseDir
  $env:BLACKSKIES_PROJECT_BASE_DIR = $projectBaseDir

  Write-Host "Building Electron main bundle..." -ForegroundColor Cyan
  pnpm --filter app build:main

  $pythonExe = Join-Path ".\\.venv\\Scripts" "python.exe"
  if (-not (Test-Path -LiteralPath $pythonExe)) {
    throw "Virtual environment Python executable not found at $pythonExe."
  }

  Write-Host "Launching Vite renderer and Electron shell for smoke test..." -ForegroundColor Cyan
  Start-SmokeViteWindow
  Start-SmokeElectronWindow -PythonExe $pythonExe -ProjectBaseDir $projectBaseDir
  exit 0
}

Ensure-Venv
Install-LockFile (Join-Path "." "requirements.lock")
Install-LockFile (Join-Path "." "requirements.dev.lock")
Ensure-Python-Tools
Sync-Node

Run-Tests

if ($LaunchGui) {
  Write-Host "Starting developer services..." -ForegroundColor Cyan
  try {
    Start-ServicesWindow
    Start-RendererWindow
  } catch {
    Write-Error $_
    exit 1
  }
}

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

