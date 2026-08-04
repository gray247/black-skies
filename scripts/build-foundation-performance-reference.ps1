param(
  [Parameter(Mandatory = $true)]
  [string]$SourceCandidate,

  [Parameter(Mandatory = $true)]
  [string]$WorkingRoot,

  [Parameter(Mandatory = $true)]
  [string]$ResultPath
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$worktree = [System.IO.Path]::GetFullPath($WorkingRoot)
$result = [System.IO.Path]::GetFullPath($ResultPath)

function Assert-FoundationReference {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) {
    throw "[foundation-performance-reference] $Message"
  }
}

Assert-FoundationReference (-not (Test-Path -LiteralPath $worktree)) "Reference worktree already exists: $worktree"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $worktree) | Out-Null
& git -C $repoRoot cat-file -e "$SourceCandidate^{commit}"
Assert-FoundationReference ($LASTEXITCODE -eq 0) "Reference source candidate is unavailable: $SourceCandidate"

& git -C $repoRoot worktree add --detach $worktree $SourceCandidate
Assert-FoundationReference ($LASTEXITCODE -eq 0) "Unable to create the reference worktree."

Push-Location $worktree
try {
  & pnpm install --recursive --frozen-lockfile
  Assert-FoundationReference ($LASTEXITCODE -eq 0) "Reference dependency installation failed."
  & pnpm --filter app run package:dir
  Assert-FoundationReference ($LASTEXITCODE -eq 0) "Reference unpacked package build failed."
} finally {
  Pop-Location
}

$executable = Join-Path $worktree "app\release\win-unpacked\Black Skies.exe"
$asar = Join-Path $worktree "app\release\win-unpacked\resources\app.asar"
Assert-FoundationReference (Test-Path -LiteralPath $executable -PathType Leaf) "Reference executable is missing."
Assert-FoundationReference (Test-Path -LiteralPath $asar -PathType Leaf) "Reference ASAR is missing."

$resultDirectory = Split-Path -Parent $result
New-Item -ItemType Directory -Force -Path $resultDirectory | Out-Null
[ordered]@{
  sourceCandidate = $SourceCandidate
  executablePath = $executable
  executable = [ordered]@{
    byteLength = (Get-Item -LiteralPath $executable).Length
    sha256 = (Get-FileHash -LiteralPath $executable -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  asar = [ordered]@{
    byteLength = (Get-Item -LiteralPath $asar).Length
    sha256 = (Get-FileHash -LiteralPath $asar -Algorithm SHA256).Hash.ToLowerInvariant()
  }
} | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $result -Encoding utf8

Write-Host "FOUNDATION_PERFORMANCE_REFERENCE_BUILD_PASS"
