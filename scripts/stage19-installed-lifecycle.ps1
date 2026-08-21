param(
  [Parameter(Mandatory = $true)]
  [string]$InstallerPath,

  [Parameter(Mandatory = $true)]
  [string]$ReceiptPath,

  [string]$WorkingRoot = (Join-Path $env:LOCALAPPDATA ("BlackSkiesQualification\19-19-" + [guid]::NewGuid().ToString("N"))),

  [switch]$SkipFirewallIsolation
)

$ErrorActionPreference = "Stop"
$installer = [System.IO.Path]::GetFullPath($InstallerPath)
$receipt = [System.IO.Path]::GetFullPath($ReceiptPath)
$working = [System.IO.Path]::GetFullPath($WorkingRoot)
$installDirectory = Join-Path $working "installed"
$smokeDirectory = Join-Path $working "external-data"
$smokeResultPath = Join-Path $working "installed-smoke.json"
$firewallRuleName = "BlackSkies-19.19-" + [guid]::NewGuid().ToString("N")
$installedExecutable = Join-Path $installDirectory "Black Skies.exe"
$uninstaller = Join-Path $installDirectory "Uninstall Black Skies.exe"
$installed = $false
$firewallCreated = $false
$shortcutPaths = @()
$registrationPath = $null
$smoke = $null
$offlineFirewallRuleApplied = -not $SkipFirewallIsolation

function Assert-Stage19 {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) {
    throw "[stage19-installed] $Message"
  }
}

function Test-IsElevated {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

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
Assert-Stage19 ((Get-AuthenticodeSignature -LiteralPath $installer).Status -eq "NotSigned") "Installer signature truth is not NotSigned."
if (-not $SkipFirewallIsolation) {
  Assert-Stage19 (Test-IsElevated) "Exact offline lifecycle qualification requires an elevated PowerShell because it creates a temporary outbound firewall rule. Black Skies does not create firewall rules during normal runtime. Rerun this command as Administrator, or pass -SkipFirewallIsolation for an application-only install/smoke/uninstall check."
} else {
  Write-Warning "[stage19-installed] Firewall isolation is disabled by explicit request; this is application-only smoke evidence and cannot qualify the exact offline lifecycle gate."
}

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

  if (-not $SkipFirewallIsolation) {
    New-NetFirewallRule -DisplayName $firewallRuleName -Direction Outbound -Program $installedExecutable -Action Block -Profile Any | Out-Null
    $firewallCreated = $true
    $firewall = Get-NetFirewallRule -DisplayName $firewallRuleName
    Assert-Stage19 ($firewall.Enabled -eq "True" -and $firewall.Action -eq "Block") "Outbound firewall isolation was not active."
  }

  $smokeArguments = @(
    "--executable", $installedExecutable,
    "--root", $smokeDirectory,
    "--result", $smokeResultPath,
    "--representative"
  )
  & node (Join-Path (Split-Path -Parent $PSScriptRoot) "app\scripts\stage19-installed-smoke.mjs") @smokeArguments
  Assert-Stage19 ($LASTEXITCODE -eq 0) "Installed application lifecycle smoke failed."
  $smoke = Get-Content -LiteralPath $smokeResultPath -Raw | ConvertFrom-Json
  Assert-Stage19 ($smoke.appIsPackaged -eq $true) "Installed smoke did not prove app.isPackaged."
  Assert-Stage19 ($smoke.canonicalWindowCount -eq 1 -and $smoke.canonicalSandboxedWindowCount -eq 1) "Installed smoke did not prove the one-window canonical Writing start."
  Assert-Stage19 ($smoke.postOptionalWindowCount -eq 2 -and $smoke.postOptionalSandboxedWindowCount -eq 2) "Installed smoke did not prove the optional two-window Command transition."
  Assert-Stage19 ($smoke.forbiddenRuntimeProcessCount -eq 0) "Installed smoke found a forbidden runtime process."
  Assert-Stage19 ($smoke.exactMarkdownMatched -eq $true) "Installed smoke did not match exact Markdown bytes."

} finally {
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
$externalManifestPath = Join-Path $working "stage19-22-external-manifest.json"
$lifecycleEvidencePath = Join-Path $working "stage19-22-lifecycle-evidence.json"
$externalManifest = @(
  Get-ChildItem -LiteralPath $smokeDirectory -Recurse -File |
    Sort-Object FullName |
    ForEach-Object {
      [ordered]@{
        path = [System.IO.Path]::GetRelativePath($smokeDirectory, $_.FullName).Replace("\", "/")
        byteLength = $_.Length
        sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
      }
    }
)
Assert-Stage19 ($externalManifest.Count -gt 0) "External preservation manifest is empty."
$externalManifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $externalManifestPath -Encoding utf8

$reinstallProcess = Start-Process -FilePath $installer -ArgumentList @("/S", "/D=$installDirectory") -Wait -PassThru -WindowStyle Hidden
Assert-Stage19 ($reinstallProcess.ExitCode -eq 0) "NSIS same-installer reinstall exited with code $($reinstallProcess.ExitCode)."
Wait-PathState -LiteralPath $installedExecutable -Exists $true
Wait-PathState -LiteralPath (Join-Path $installDirectory "resources\app.asar") -Exists $true
Assert-Stage19 ((Get-AuthenticodeSignature -LiteralPath $installedExecutable).Status -eq "NotSigned") "Reinstalled executable signature truth is not NotSigned."

$performanceReceipt = $smoke.performance
$receiptDocument | Add-Member -NotePropertyName installedLifecycle -NotePropertyValue ([ordered]@{
  status = "passed"
  installationDirectory = $installDirectory
  appIsPackaged = $smoke.appIsPackaged
  canonicalWindowCount = $smoke.canonicalWindowCount
  canonicalSandboxedWindowCount = $smoke.canonicalSandboxedWindowCount
  postOptionalWindowCount = $smoke.postOptionalWindowCount
  postOptionalSandboxedWindowCount = $smoke.postOptionalSandboxedWindowCount
  forbiddenRuntimeProcessCount = $smoke.forbiddenRuntimeProcessCount
  zeroSurvivorProcessCount = $smoke.zeroSurvivorProcessCount
  performance = $performanceReceipt
  offlineFirewallRuleApplied = $offlineFirewallRuleApplied
  qualificationMode = if ($offlineFirewallRuleApplied) { "offline-firewall-isolated" } else { "application-only-no-firewall" }
  exactMarkdownMatched = $smoke.exactMarkdownMatched
  exportedUnitCount = $smoke.exportedUnitCount
  externalProjectPreserved = $true
  externalExportPreserved = $true
  uninstallRemovedApplication = $true
  sameInstallerReinstallPassed = $true
  completedAtUtc = [DateTime]::UtcNow.ToString("o")
})
$receiptDocument | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $receipt -Encoding utf8

[ordered]@{
  schema = "black-skies.stage19-22.lifecycle-evidence.v1"
  qualifiedCommit = $receiptDocument.qualifiedCommit
  installedOffline = $offlineFirewallRuleApplied
  qualificationMode = if ($offlineFirewallRuleApplied) { "offline-firewall-isolated" } else { "application-only-no-firewall" }
  representativeWorkloadPassed = $smoke.exactMarkdownMatched -eq $true
  forbiddenRuntimeProcessCount = $smoke.forbiddenRuntimeProcessCount
  uninstallRemovedApplication = $true
  externalDataPreserved = $true
  sameInstallerReinstallPassed = $true
  completedAtUtc = [DateTime]::UtcNow.ToString("o")
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $lifecycleEvidencePath -Encoding utf8

Write-Host "STAGE19_INSTALLED_LIFECYCLE_PASS"
