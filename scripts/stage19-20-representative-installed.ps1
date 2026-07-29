param(
  [Parameter(Mandatory = $true)]
  [string]$InstalledExecutable,

  [Parameter(Mandatory = $true)]
  [string]$EvidenceRoot
)

$ErrorActionPreference = "Stop"
$expectedExecutableHash = "4ac995b39fb917f7f1d4b7afa8d2bf148f6caf60bc66e4899b3e20edafc04e59"
$expectedAsarHash = "2d1343640a53882d4a26589b526973886e899fd3dbabfc4625b8cd34396c3e4b"
$executable = [System.IO.Path]::GetFullPath($InstalledExecutable)
$evidenceRoot = [System.IO.Path]::GetFullPath($EvidenceRoot)
$installDirectory = Split-Path -Parent $executable
$asarPath = Join-Path $installDirectory "resources\app.asar"
$externalDataDirectory = Join-Path $evidenceRoot "ExternalData"
$smokeResultPath = Join-Path $evidenceRoot "representative-installed-smoke.json"
$evidencePath = Join-Path $evidenceRoot "representative-installed-evidence.json"

function Assert-Stage19 {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) {
    throw "[stage19-20-representative] $Message"
  }
}

Assert-Stage19 (Test-Path -LiteralPath $executable -PathType Leaf) "The installed executable is missing."
Assert-Stage19 (Test-Path -LiteralPath $asarPath -PathType Leaf) "The installed ASAR is missing."
Assert-Stage19 ((Get-FileHash -LiteralPath $executable -Algorithm SHA256).Hash.ToLowerInvariant() -eq $expectedExecutableHash) "Installed executable SHA-256 differs."
Assert-Stage19 ((Get-FileHash -LiteralPath $asarPath -Algorithm SHA256).Hash.ToLowerInvariant() -eq $expectedAsarHash) "Installed ASAR SHA-256 differs."
Assert-Stage19 ((Get-AuthenticodeSignature -LiteralPath $executable).Status -eq "NotSigned") "Installed signature truth differs."
Assert-Stage19 (-not (Test-Path -LiteralPath $evidenceRoot)) "The representative evidence root already exists."

New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null

& node (Join-Path (Split-Path -Parent $PSScriptRoot) "app\scripts\stage19-installed-smoke.mjs") `
  --executable $executable `
  --root $externalDataDirectory `
  --result $smokeResultPath `
  --representative
Assert-Stage19 ($LASTEXITCODE -eq 0) "The installed representative smoke failed."

$smoke = Get-Content -LiteralPath $smokeResultPath -Raw | ConvertFrom-Json
Assert-Stage19 ($smoke.appIsPackaged -eq $true) "The application did not report packaged truth."
Assert-Stage19 ($smoke.sandboxedWindowCount -eq 2) "Both installed windows were not sandboxed."
Assert-Stage19 ($smoke.forbiddenRuntimeProcessCount -eq 0) "A forbidden runtime descendant appeared."
Assert-Stage19 ($smoke.exactMarkdownMatched -eq $true) "The small exact export differed."
Assert-Stage19 ($smoke.representative.unitCount -eq 100) "The representative unit count differed."
Assert-Stage19 ($smoke.representative.creationDurationMs -lt 15000) "The representative creation ceiling failed."
Assert-Stage19 ($smoke.representative.selectionDurationMs -lt 3000) "The representative selection ceiling failed."
Assert-Stage19 ($smoke.representative.exactMarkdownMatched -eq $true) "The representative export bytes differed."
Assert-Stage19 ((Get-FileHash -LiteralPath $executable -Algorithm SHA256).Hash.ToLowerInvariant() -eq $expectedExecutableHash) "Installed executable changed during the test."
Assert-Stage19 ((Get-FileHash -LiteralPath $asarPath -Algorithm SHA256).Hash.ToLowerInvariant() -eq $expectedAsarHash) "Installed ASAR changed during the test."

$evidence = [ordered]@{
  schema = "black-skies.stage19-20.representative-installed.v1"
  status = "passed"
  installedExecutable = $executable
  installedExecutableSha256 = $expectedExecutableHash
  installedAsarSha256 = $expectedAsarHash
  appIsPackaged = $smoke.appIsPackaged
  sandboxedWindowCount = $smoke.sandboxedWindowCount
  forbiddenRuntimeProcessCount = $smoke.forbiddenRuntimeProcessCount
  smallProject = [ordered]@{
    projectPath = $smoke.projectPath
    exportPath = $smoke.exportPath
    exportSha256 = $smoke.exportSha256
    exactMarkdownMatched = $smoke.exactMarkdownMatched
  }
  representative = [ordered]@{
    projectPath = $smoke.representative.projectPath
    exportPath = $smoke.representative.exportPath
    exportSha256 = $smoke.representative.exportSha256
    unitCount = $smoke.representative.unitCount
    creationDurationMs = $smoke.representative.creationDurationMs
    selectionDurationMs = $smoke.representative.selectionDurationMs
    exactMarkdownMatched = $smoke.representative.exactMarkdownMatched
  }
  offlineFirewallEvidence = "reused-from-package-19.19-run-30492203867"
  protectedEvidenceUsed = $false
  completedAtUtc = [DateTime]::UtcNow.ToString("o")
}
$evidence | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $evidencePath -Encoding utf8

Write-Host ($evidence | ConvertTo-Json -Depth 10)
Write-Host "STAGE19_20_REPRESENTATIVE_INSTALLED_PASS"
