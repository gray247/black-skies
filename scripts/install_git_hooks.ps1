param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$hookPath = Join-Path $repoRoot 'scripts/hooks'
$hookFile = Join-Path $hookPath 'pre-commit'

if (-not (Test-Path -LiteralPath $hookFile)) {
    throw "Expected hook file not found: $hookFile"
}

git config --local core.hooksPath 'scripts/hooks'

$installedPath = git config --local --get core.hooksPath
Write-Host "Configured local git hooks path: $installedPath"
Write-Host "Pre-commit hygiene hook: $hookFile"
