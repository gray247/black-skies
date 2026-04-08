param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$templatePath = Join-Path $repoRoot 'scripts/hooks/pre-commit'
$hookDir = Join-Path $repoRoot '.git/hooks'
$hookFile = Join-Path $hookDir 'pre-commit'

if (-not (Test-Path -LiteralPath $templatePath)) {
    throw "Expected hook template not found: $templatePath"
}

New-Item -ItemType Directory -Force -Path $hookDir | Out-Null

$pythonPath = (Get-Command python).Source
$template = Get-Content -Raw -LiteralPath $templatePath
$hookBody = $template -replace '^\#\![^\r\n]+', "#!$pythonPath"
[System.IO.File]::WriteAllText($hookFile, $hookBody, [System.Text.UTF8Encoding]::new($false))

git config --local core.hooksPath '.git/hooks'

Write-Host "Installed pre-commit hook at: $hookFile"
Write-Host "Git hooks path: .git/hooks"
Write-Host "Python launcher: $pythonPath"
