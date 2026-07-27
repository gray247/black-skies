[CmdletBinding()]
param(
    [switch]$OptionalServiceFailure
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$appRoot = Join-Path $repositoryRoot 'app'
$electronExecutable = Join-Path $appRoot 'node_modules\.bin\electron.cmd'
$mainEntry = Join-Path $appRoot 'dist-electron\main\main.js'
$pythonExecutable = Join-Path $repositoryRoot '.venv\Scripts\python.exe'

Push-Location -LiteralPath $repositoryRoot
try {
    $worktreeStatus = (& git status --porcelain)
    if ($LASTEXITCODE -ne 0) {
        throw 'The repository state could not be checked.'
    }
    if ($worktreeStatus) {
        throw 'Package 19.18 requires a clean committed worktree. Ask Codex to inspect it before continuing.'
    }

    if (-not (Test-Path -LiteralPath $electronExecutable -PathType Leaf)) {
        throw 'Electron dependencies are unavailable. Ask Codex to restore the locked workspace dependencies.'
    }
    if (-not (Test-Path -LiteralPath $pythonExecutable -PathType Leaf)) {
        throw 'The approved local Python environment is unavailable.'
    }

    Remove-Item Env:ELECTRON_RENDERER_URL -ErrorAction SilentlyContinue
    Remove-Item Env:VITE_DEV_SERVER_URL -ErrorAction SilentlyContinue
    Remove-Item Env:PLAYWRIGHT -ErrorAction SilentlyContinue
    Remove-Item Env:BLACKSKIES_E2E_MODE -ErrorAction SilentlyContinue
    Remove-Item Env:BLACKSKIES_ENABLE_HARNESS_HOOKS -ErrorAction SilentlyContinue
    $env:BLACKSKIES_PYTHON = $pythonExecutable

    if ($OptionalServiceFailure) {
        $env:BLACKSKIES_SERVICES_PORT = 'intentional-package-19-18-failure'
        Write-Host 'Launching the stable core with an intentional optional-service failure.'
    }
    else {
        Remove-Item Env:BLACKSKIES_SERVICES_PORT -ErrorAction SilentlyContinue
        Write-Host 'Launching the stable Package 19.18 development build.'
    }

    & cmd.exe /d /c 'pnpm --dir app run build:production'
    if ($LASTEXITCODE -ne 0) {
        throw "The stable development build failed with exit code $LASTEXITCODE."
    }

    Push-Location -LiteralPath $appRoot
    try {
        & $electronExecutable $mainEntry
        if ($LASTEXITCODE -ne 0) {
            throw "Black Skies exited with code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    Remove-Item Env:BLACKSKIES_SERVICES_PORT -ErrorAction SilentlyContinue
    Pop-Location
}
