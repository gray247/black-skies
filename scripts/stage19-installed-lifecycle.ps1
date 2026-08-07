param(
  [Parameter(Mandatory = $true)]
  [string]$InstallerPath,

  [Parameter(Mandatory = $true)]
  [string]$ReceiptPath,

  [string]$PerformanceReferenceExecutable = "",

  [string]$PerformanceReferenceCommit = "",

  [string]$WorkingRoot = (Join-Path $env:LOCALAPPDATA ("BlackSkiesQualification\19-19-" + [guid]::NewGuid().ToString("N")))
)

$ErrorActionPreference = "Stop"
$installer = [System.IO.Path]::GetFullPath($InstallerPath)
$receipt = [System.IO.Path]::GetFullPath($ReceiptPath)
$working = [System.IO.Path]::GetFullPath($WorkingRoot)
$performanceReferenceRequested = -not [string]::IsNullOrWhiteSpace($PerformanceReferenceExecutable)
$performanceReference = if ($performanceReferenceRequested) {
  [System.IO.Path]::GetFullPath($PerformanceReferenceExecutable)
} else {
  $null
}
$installDirectory = Join-Path $working "installed"
$smokeDirectory = Join-Path $working "external-data"
$smokeResultPath = Join-Path $working "installed-smoke.json"
$firewallRuleName = "BlackSkies-19.19-" + [guid]::NewGuid().ToString("N")
$referenceFirewallRuleName = "BlackSkies-19.19-reference-" + [guid]::NewGuid().ToString("N")
$installedExecutable = Join-Path $installDirectory "Black Skies.exe"
$uninstaller = Join-Path $installDirectory "Uninstall Black Skies.exe"
$installed = $false
$firewallCreated = $false
$referenceFirewallCreated = $false
$shortcutPaths = @()
$registrationPath = $null
$smoke = $null

function Assert-Stage19 {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) {
    throw "[stage19-installed] $Message"
  }
}

Assert-Stage19 (
  $performanceReferenceRequested -eq (-not [string]::IsNullOrWhiteSpace($PerformanceReferenceCommit))
) "Performance reference executable and commit must be provided together."

function Wait-PathState {
  param([string]$LiteralPath, [bool]$Exists, [int]$TimeoutSeconds = 30)
  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  do {
    if ((Test-Path -LiteralPath $LiteralPath) -eq $Exists) {
      return
    }
    Start-Sleep -Milliseconds 250
  } while ([DateTime]::UtcNow -lt $deadline)
  throw "[stage19-installed] Timed out waiting for path state Exists=$Exists`: $LiteralPath"
}

function Get-Registration {
  $roots = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall"
  )
  foreach ($root in $roots) {
    if (-not (Test-Path -LiteralPath $root)) {
      continue
    }
    foreach ($entry in Get-ChildItem -LiteralPath $root) {
      $properties = Get-ItemProperty -LiteralPath $entry.PSPath
      if (
        $properties.DisplayName -eq "Black Skies 1.0.0-rc1" -and
        $properties.DisplayVersion -eq "1.0.0-rc1"
      ) {
        return $entry.PSPath
      }
    }
  }
  return $null
}

function Get-ShortcutTruth {
  param([string]$ShortcutPath)
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($ShortcutPath)
  return [ordered]@{
    path = $ShortcutPath
    targetPath = [System.IO.Path]::GetFullPath($shortcut.TargetPath)
    iconLocation = $shortcut.IconLocation
  }
}

function Get-EmbeddedIconPngHash {
  param([string]$SourcePath)
  Add-Type -AssemblyName System.Drawing
  $temporary = Join-Path $working ([guid]::NewGuid().ToString("N") + ".png")
  try {
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($SourcePath)
    Assert-Stage19 ($null -ne $icon) "No embedded icon was available in $SourcePath."
    $bitmap = $icon.ToBitmap()
    try {
      $bitmap.Save($temporary, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $bitmap.Dispose()
      $icon.Dispose()
    }
    return (Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash.ToLowerInvariant()
  } finally {
    if (Test-Path -LiteralPath $temporary) {
      Remove-Item -LiteralPath $temporary -Force
    }
  }
}

New-Item -ItemType Directory -Path $working -Force | Out-Null
Assert-Stage19 (Test-Path -LiteralPath $installer -PathType Leaf) "Installer is missing."
Assert-Stage19 (Test-Path -LiteralPath $receipt -PathType Leaf) "Qualification receipt is missing."
if ($performanceReferenceRequested) {
  Assert-Stage19 (Test-Path -LiteralPath $performanceReference -PathType Leaf) "Performance reference executable is missing."
}
Assert-Stage19 ((Get-AuthenticodeSignature -LiteralPath $installer).Status -eq "NotSigned") "Installer signature truth is not NotSigned."

try {
  $installerProcess = Start-Process -FilePath $installer -ArgumentList @("/S", "/D=$installDirectory") -Wait -PassThru -WindowStyle Hidden
  Assert-Stage19 ($installerProcess.ExitCode -eq 0) "NSIS install exited with code $($installerProcess.ExitCode)."
  $installed = $true
  Wait-PathState -LiteralPath $installedExecutable -Exists $true
  Wait-PathState -LiteralPath $uninstaller -Exists $true

  $registrationPath = Get-Registration
  Assert-Stage19 ($null -ne $registrationPath) "Apps & Features registration was not found."
  $registration = Get-ItemProperty -LiteralPath $registrationPath
  $registeredUninstaller = ($registration.UninstallString -replace "\s+/currentuser\s*$", "").Trim('"')
  Assert-Stage19 ([System.IO.Path]::GetFullPath($registeredUninstaller) -eq $uninstaller) "Registration uninstaller path differed."

  $desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Black Skies.lnk"
  $startMenuShortcut = Join-Path ([Environment]::GetFolderPath("Programs")) "Black Skies.lnk"
  foreach ($shortcutPath in @($desktopShortcut, $startMenuShortcut)) {
    Assert-Stage19 (Test-Path -LiteralPath $shortcutPath -PathType Leaf) "Shortcut is missing: $shortcutPath"
    $truth = Get-ShortcutTruth -ShortcutPath $shortcutPath
    Assert-Stage19 ($truth.targetPath -eq $installedExecutable) "Shortcut target differed: $shortcutPath"
    if ($truth.iconLocation) {
      $shortcutIconPath = ($truth.iconLocation -split ",")[0].Trim('"')
      Assert-Stage19 ([System.IO.Path]::GetFullPath($shortcutIconPath) -eq $installedExecutable) "Shortcut icon source differed: $shortcutPath"
    }
    $shortcutPaths += $shortcutPath
  }

  $electronDefaultExecutable = Join-Path (Split-Path -Parent $PSScriptRoot) "app\node_modules\electron\dist\electron.exe"
  Assert-Stage19 (Test-Path -LiteralPath $electronDefaultExecutable -PathType Leaf) "The build-time default Electron icon witness is missing."
  $defaultElectronIconHash = Get-EmbeddedIconPngHash -SourcePath $electronDefaultExecutable
  $executableIconHash = Get-EmbeddedIconPngHash -SourcePath $installedExecutable
  $installerIconHash = Get-EmbeddedIconPngHash -SourcePath $installer
  Assert-Stage19 ($executableIconHash -eq $installerIconHash) "Installer and installed executable embedded icons differ."
  Assert-Stage19 ($executableIconHash -ne $defaultElectronIconHash) "Packaged executables still use the Electron default icon."

  New-NetFirewallRule -DisplayName $firewallRuleName -Direction Outbound -Program $installedExecutable -Action Block -Profile Any | Out-Null
  $firewallCreated = $true
  if ($performanceReferenceRequested) {
    New-NetFirewallRule -DisplayName $referenceFirewallRuleName -Direction Outbound -Program $performanceReference -Action Block -Profile Any | Out-Null
    $referenceFirewallCreated = $true
  }
  $firewall = Get-NetFirewallRule -DisplayName $firewallRuleName
  Assert-Stage19 ($firewall.Enabled -eq "True" -and $firewall.Action -eq "Block") "Outbound firewall isolation was not active."

  $smokeArguments = @(
    "--executable", $installedExecutable,
    "--root", $smokeDirectory,
    "--result", $smokeResultPath,
    "--representative"
  )
  if ($performanceReferenceRequested) {
    $smokeArguments += @(
      "--paired-reference-executable", $performanceReference,
      "--paired-reference-commit", $PerformanceReferenceCommit
    )
  }
  & node (Join-Path (Split-Path -Parent $PSScriptRoot) "app\scripts\stage19-installed-smoke.mjs") @smokeArguments
  Assert-Stage19 ($LASTEXITCODE -eq 0) "Installed application lifecycle smoke failed."
  $smoke = Get-Content -LiteralPath $smokeResultPath -Raw | ConvertFrom-Json
  Assert-Stage19 ($smoke.appIsPackaged -eq $true) "Installed smoke did not prove app.isPackaged."
  Assert-Stage19 ($smoke.sandboxedWindowCount -eq 2) "Installed smoke did not prove two sandboxed windows."
  Assert-Stage19 ($smoke.forbiddenRuntimeProcessCount -eq 0) "Installed smoke found a forbidden runtime process."
  Assert-Stage19 ($smoke.exactMarkdownMatched -eq $true) "Installed smoke did not match exact Markdown bytes."

} finally {
  if ($referenceFirewallCreated) {
    Remove-NetFirewallRule -DisplayName $referenceFirewallRuleName -ErrorAction SilentlyContinue
  }
  if ($firewallCreated) {
    Remove-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
  }
  if ($installed -and (Test-Path -LiteralPath $uninstaller -PathType Leaf)) {
    $uninstallProcess = Start-Process -FilePath $uninstaller -ArgumentList @("/S") -Wait -PassThru -WindowStyle Hidden
    Assert-Stage19 ($uninstallProcess.ExitCode -eq 0) "NSIS uninstall exited with code $($uninstallProcess.ExitCode)."
    Wait-PathState -LiteralPath $installedExecutable -Exists $false
  }
}

Assert-Stage19 (-not (Test-Path -LiteralPath $installedExecutable)) "Installed executable remained after uninstall."
Assert-Stage19 (-not (Test-Path -LiteralPath $uninstaller)) "Uninstaller remained after uninstall."
foreach ($shortcutPath in $shortcutPaths) {
  Assert-Stage19 (-not (Test-Path -LiteralPath $shortcutPath)) "Shortcut remained after uninstall: $shortcutPath"
}
Assert-Stage19 ($null -eq (Get-Registration)) "Apps & Features registration remained after uninstall."
Assert-Stage19 ($null -ne $smoke) "Installed smoke result was not produced."
Assert-Stage19 (Test-Path -LiteralPath $smoke.projectPath -PathType Container) "External disposable project was removed."
Assert-Stage19 (Test-Path -LiteralPath $smoke.exportPath -PathType Leaf) "External Markdown export was removed."
Assert-Stage19 ((Get-FileHash -LiteralPath $smoke.exportPath -Algorithm SHA256).Hash.ToLowerInvariant() -eq $smoke.exportSha256) "External Markdown export changed during uninstall."
foreach ($file in $smoke.projectFiles) {
  $absolute = Join-Path $smoke.projectPath ($file.path -replace "/", "\")
  Assert-Stage19 (Test-Path -LiteralPath $absolute -PathType Leaf) "External project file was removed: $($file.path)"
  Assert-Stage19 ((Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLowerInvariant() -eq $file.sha256) "External project file changed: $($file.path)"
}

$receiptDocument = Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json
$performanceReceipt = $smoke.performance
if ($performanceReferenceRequested) {
  Assert-Stage19 ($null -ne $performanceReceipt.pairedReference) "Interleaved performance reference result was not produced."
  $referenceAsar = Join-Path (Join-Path (Split-Path -Parent $performanceReference) "resources") "app.asar"
  Assert-Stage19 (Test-Path -LiteralPath $referenceAsar -PathType Leaf) "Performance reference ASAR is missing."
  $candidateLaunchMs = [double]$smoke.performance.coldLaunchDurationMs
  $referenceLaunchMs = [double]$performanceReceipt.pairedReference.performance.coldLaunchDurationMs
  Assert-Stage19 ($candidateLaunchMs -gt 0 -and $referenceLaunchMs -gt 0) "Paired startup measurements are invalid."
  $performanceReceipt.pairedReference | Add-Member -Force -NotePropertyName executable -NotePropertyValue ([ordered]@{
    byteLength = (Get-Item -LiteralPath $performanceReference).Length
    sha256 = (Get-FileHash -LiteralPath $performanceReference -Algorithm SHA256).Hash.ToLowerInvariant()
  })
  $performanceReceipt.pairedReference | Add-Member -Force -NotePropertyName asar -NotePropertyValue ([ordered]@{
    byteLength = (Get-Item -LiteralPath $referenceAsar).Length
    sha256 = (Get-FileHash -LiteralPath $referenceAsar -Algorithm SHA256).Hash.ToLowerInvariant()
  })
  $performanceReceipt.pairedReference | Add-Member -Force -NotePropertyName candidateToReferenceRatio -NotePropertyValue ($candidateLaunchMs / $referenceLaunchMs)
}
$receiptDocument | Add-Member -NotePropertyName installedLifecycle -NotePropertyValue ([ordered]@{
  status = "passed"
  installationDirectory = $installDirectory
  appIsPackaged = $smoke.appIsPackaged
  windowCount = $smoke.windowCount
  sandboxedWindowCount = $smoke.sandboxedWindowCount
  forbiddenRuntimeProcessCount = $smoke.forbiddenRuntimeProcessCount
  zeroSurvivorProcessCount = $smoke.zeroSurvivorProcessCount
  performance = $performanceReceipt
  offlineFirewallRuleApplied = $true
  exactMarkdownMatched = $smoke.exactMarkdownMatched
  exportedUnitCount = $smoke.exportedUnitCount
  externalProjectPreserved = $true
  externalExportPreserved = $true
  uninstallRemovedApplication = $true
  completedAtUtc = [DateTime]::UtcNow.ToString("o")
})
$receiptDocument | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $receipt -Encoding utf8

Write-Host "STAGE19_INSTALLED_LIFECYCLE_PASS"
