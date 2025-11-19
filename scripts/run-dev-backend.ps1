# scripts/run-dev-backend.ps1
<#
Dev helper — safe to run locally. Does not change production code.
Usage:
  powershell -ExecutionPolicy Bypass -File scripts/run-dev-backend.ps1
  powershell -ExecutionPolicy Bypass -File scripts/run-dev-backend.ps1 -Background

This runs uvicorn in the foreground by default so you can see logs.
#>

param(
  [switch]$Background
)

$root = Split-Path -Parent $PSScriptRoot
Write-Host "Repo root:" $root

# Set PYTHONPATH so uvicorn can find repo packages
$repoPythonPath = "$root;$root\services\src"
if ($env:PYTHONPATH -and $env:PYTHONPATH.Trim()) {
  $repoPythonPath = "$repoPythonPath;$env:PYTHONPATH"
}
$env:PYTHONPATH = $repoPythonPath
Write-Host "PYTHONPATH set to:" $env:PYTHONPATH

# Ensure logs and sample projects dir exist
$logsDir = Join-Path $root "logs"
$sampleProjects = Join-Path $root "work\sample_projects"
if (!(Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
  Write-Host "Created logs dir at" $logsDir
}
if (!(Test-Path $sampleProjects)) {
  New-Item -ItemType Directory -Path $sampleProjects -Force | Out-Null
  Write-Host "Created sample projects dir at" $sampleProjects
}

# Export a safe env var for project base dir (only for this session)
if (-not $env:BLACKSKIES_PROJECT_BASE_DIR -or $env:BLACKSKIES_PROJECT_BASE_DIR -eq "") {
  $env:BLACKSKIES_PROJECT_BASE_DIR = $sampleProjects
  Write-Host "Set BLACKSKIES_PROJECT_BASE_DIR to" $env:BLACKSKIES_PROJECT_BASE_DIR
} else {
  Write-Host "Using existing BLACKSKIES_PROJECT_BASE_DIR =" $env:BLACKSKIES_PROJECT_BASE_DIR
}

# Uvicorn command
$uvicornCmd = "python -m uvicorn services.src.blackskies.services.app:app --host 127.0.0.1 --port 8000 --log-level debug"
$logFile = Join-Path $logsDir "uvicorn.log"

if ($Background) {
  Write-Host "Starting uvicorn in background; logs -> $logFile"
  Start-Process powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command","$uvicornCmd *> `"$logFile`"" -WindowStyle Hidden
  Write-Host "Process started in background. Tail logs with Get-Content -Wait $logFile"
} else {
  Write-Host "Starting uvicorn in foreground. Logs will also be written to $logFile"
  # Run uvicorn and tee output to log file so you see it live and it's saved
  # Note: using PowerShell To capture combined stdout/stderr and tee:
  & cmd /c "$uvicornCmd 2>&1 | powershell -NoProfile -Command { param($f) $input | Tee-Object -FilePath $f }" $logFile
  $exitCode = $LASTEXITCODE
  Write-Host "uvicorn exited with code" $exitCode
  if (Test-Path $logFile) {
    Write-Host "Last 120 lines of $logFile`n"
    Get-Content $logFile -Tail 120
  }
}
