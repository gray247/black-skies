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

  Ensure-Command -Name 'python'

  $venvDir = Join-Path $PWD '.venv'
  $venvPython = Join-Path $venvDir 'Scripts\python.exe'

  if (-not (Test-Path $venvPython)) {
    Write-Host 'Creating virtual environment at .venv ...'
    python -m venv '.venv'
  }

  if (-not (Test-Path $venvPython)) {
    throw 'Virtual environment was not created successfully. Check Python installation and try again.'
  }

  Write-Host 'Upgrading pip ...'
  & $venvPython -m pip install --upgrade pip | Out-Default

  Write-Host 'Installing backend dependencies (requirements.win.dev.txt) ...'
  & $venvPython -m pip install -r '.\requirements.win.dev.txt' | Out-Default

  $servicesSrc = Join-Path $PWD 'services\src'
  if (-not (Test-Path $servicesSrc)) {
    throw "Unable to locate services source directory at '$servicesSrc'."
  }

  $currentPythonPath = $env:PYTHONPATH
  if ([string]::IsNullOrWhiteSpace($currentPythonPath)) {
    $env:PYTHONPATH = $servicesSrc
  }
  elseif (-not $currentPythonPath.Split([IO.Path]::PathSeparator) -contains $servicesSrc) {
    $env:PYTHONPATH = "$servicesSrc$([IO.Path]::PathSeparator)$currentPythonPath"
  }

  Set-Item -Path Env:BLACKSKIES_CONFIG_PATH -Value (Join-Path $PWD 'config\runtime.yaml')

  Write-Host 'Starting FastAPI services on http://127.0.0.1:43750 ...' -ForegroundColor Cyan
  Push-Location 'services'
  try {
    & $venvPython -m uvicorn blackskies.services.app:create_app --factory --host 127.0.0.1 --port 43750 --reload
  }
  finally {
    Pop-Location
  }
}
finally {
  Pop-Location
}
