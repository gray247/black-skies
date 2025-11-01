Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)
try {
  function Ensure-Command {
    param (
      [Parameter(Mandatory = $true)]
      [string] $Name
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
      throw "Required command '$Name' is not available on PATH."
    }
  }

  Ensure-Command -Name 'node'
  Ensure-Command -Name 'pnpm'
  Ensure-Command -Name 'python'

  $venvDir = Join-Path $PWD '.venv'
  $venvPython = Join-Path $venvDir 'Scripts\python.exe'

  if (-not (Test-Path $venvPython)) {
    Write-Host 'Virtual environment not found. Creating .venv ...'
    # Assumes Python 3.11+ is installed per repository docs.
    python -m venv '.venv'
  }

  if (-not (Test-Path $venvPython)) {
    throw 'Virtual environment was not created successfully. Check Python installation and try again.'
  }

  Write-Host 'Ensuring workspace dependencies (pnpm install --recursive) ...'
  pnpm install --recursive | Out-Default

  Set-Item -Path Env:BLACKSKIES_PYTHON -Value $venvPython

  Write-Host 'Building Electron main process once before launching dev environment ...'
  pnpm --filter app build:main | Out-Default

  Write-Host 'Launching Electron + Vite dev environment (pnpm dev) ...' -ForegroundColor Cyan
  pnpm dev
}
finally {
  Pop-Location
}
