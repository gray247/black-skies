<#
  .SYNOPSIS
    Headless smoke test runner for Black Skies services on Windows.

  .DESCRIPTION
    Bootstraps the Python virtual environment, launches the FastAPI service,
    and drives Wizard → Draft → Critique → Accept cycles using HTTP requests.
#>
[CmdletBinding()]
param(
  [string]$ServiceHost = "127.0.0.1",
  [string]$ProjectId = "proj_esther_estate",
  [int]$Cycles = 3,
  [int]$Port = 43750,
  [double]$TimeoutSeconds = 60,
  [string]$ProjectBaseDir,
  [switch]$SkipInstall,
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$ExtraArgs
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-SmokeLog {
  param(
    [Parameter(Mandatory = $true)][ValidateSet('INFO', 'WARN', 'ERROR')][string]$Level,
    [Parameter(Mandatory = $true)][string]$Message
  )
  Write-Host "[smoke][$Level] $Message"
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
Set-Location $RepoRoot

$VenvDir = Join-Path $RepoRoot ".venv"
$PythonExe = Join-Path (Join-Path $VenvDir "Scripts") "python.exe"

if (-not (Test-Path -LiteralPath $PythonExe)) {
  Write-SmokeLog -Level INFO -Message "Creating virtual environment at $VenvDir"
  python -m venv $VenvDir
}

if (-not $SkipInstall) {
  Write-SmokeLog -Level INFO -Message "Installing Python dependencies"
  & $PythonExe -m pip install --upgrade pip | Out-Null
  & $PythonExe -m pip install --require-virtualenv -r (Join-Path $RepoRoot "requirements.lock") | Out-Null
} else {
  Write-SmokeLog -Level INFO -Message "Skipping dependency installation (-SkipInstall)"
}

if (-not $ProjectBaseDir) {
  $ProjectBaseDir = Join-Path $RepoRoot "sample_project"
}
$env:BLACKSKIES_PROJECT_BASE_DIR = $ProjectBaseDir
$previousPythonPath = $env:PYTHONPATH
if ($previousPythonPath) {
  $env:PYTHONPATH = "$RepoRoot;$previousPythonPath"
} else {
  $env:PYTHONPATH = $RepoRoot
}

Write-SmokeLog -Level INFO -Message "Starting FastAPI services on $($ServiceHost):$Port"
$serviceProcess = Start-Process -FilePath $PythonExe -ArgumentList @('-m', 'blackskies.services', '--host', $ServiceHost, '--port', $Port) -PassThru -WindowStyle Hidden

try {
  Write-SmokeLog -Level INFO -Message "Running smoke cycles ($Cycles) against $ProjectId"
  & $PythonExe -m scripts.smoke_runner --host $ServiceHost --port $Port --project-id $ProjectId --project-base-dir $ProjectBaseDir --cycles $Cycles --timeout $TimeoutSeconds --log-level INFO
  $exitCode = $LASTEXITCODE
} finally {
  if ($serviceProcess -and -not $serviceProcess.HasExited) {
    Write-SmokeLog -Level INFO -Message "Stopping FastAPI services (PID $($serviceProcess.Id))"
    $serviceProcess.Kill()
    $serviceProcess.WaitForExit()
  }
  $env:PYTHONPATH = $previousPythonPath
}

if ($exitCode -ne 0) {
  throw "Smoke test failed with exit code $exitCode"
}
