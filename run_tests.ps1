[CmdletBinding()]
param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$TestPath,

    [ValidateSet("unit", "mixed", "all")]
    [string]$Group = "mixed"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

$Python = Join-Path $RepoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $Python)) {
    throw "Python not found at $Python. Create the repo venv first."
}

$CacheDir = Join-Path $RepoRoot ".pytest-cache-local"
$TempRoot = Join-Path $RepoRoot ".pytest-tmp"
New-Item -ItemType Directory -Force -Path $CacheDir, $TempRoot | Out-Null

function Get-GroupSpecs {
    param([string]$Name)

    switch ($Name) {
        "unit" { return @("services\tests\unit\test_*.py") }
        "mixed" { return @("tests\test_*.py", "services\tests\test_*.py") }
        "all" { return @("tests\test_*.py", "services\tests\test_*.py", "services\tests\unit\test_*.py", "services\tests\prototype\test_*.py") }
        default { throw "Unknown test group: $Name" }
    }
}

function Resolve-TestSpecs {
    param([string[]]$Specs)

    $resolved = New-Object System.Collections.Generic.List[string]

    foreach ($spec in $Specs) {
        if ([string]::IsNullOrWhiteSpace($spec)) {
            continue
        }

        if (Test-Path -LiteralPath $spec) {
            $item = Get-Item -LiteralPath $spec
            if ($item.PSIsContainer) {
                Get-ChildItem -LiteralPath $item.FullName -Recurse -File -Filter "test_*.py" |
                    ForEach-Object { [void]$resolved.Add($_.FullName) }
            }
            else {
                [void]$resolved.Add($item.FullName)
            }
            continue
        }

        if ($spec.IndexOfAny(@("*", "?", "[")) -ge 0) {
            Get-ChildItem -Path $spec -File -ErrorAction Stop |
                ForEach-Object { [void]$resolved.Add($_.FullName) }
            continue
        }

        throw "Test path not found: $spec"
    }

    return $resolved | Sort-Object -Unique
}

$TestSpecs = if ($TestPath) { $TestPath } else { Get-GroupSpecs -Name $Group }
$ResolvedTests = @((Resolve-TestSpecs -Specs $TestSpecs))
if (-not $ResolvedTests -or $ResolvedTests.Count -eq 0) {
    throw "No tests matched the requested input."
}

$Basetemp = Join-Path $TempRoot ("run-$PID-{0}" -f (Get-Date -Format "yyyyMMddHHmmssfff"))
New-Item -ItemType Directory -Force -Path $Basetemp | Out-Null

# Clear repo pytest.ini addopts so fail-fast settings do not hide later failures.
$PytestArgs = @(
    "-m", "pytest",
    "--basetemp", $Basetemp,
    "-o", "cache_dir=$CacheDir",
    "-o", "addopts=",
    "--import-mode=importlib",
    "-q"
)

& $Python @PytestArgs @ResolvedTests
exit $LASTEXITCODE
