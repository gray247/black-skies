param(
    [switch]$SkipSmokeTest
)

function Exit-WithError($code, $message) {
    Write-Host $message -ForegroundColor Red
    exit $code
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
$appDir = Join-Path $repoRoot 'app'
$testResultsDir = Join-Path $appDir 'test-results'

Push-Location $repoRoot
try {
    Write-Host "Rebuilding the packaged renderer/main bundles so ELECTRON_RENDERER_URL points at dist/index.html..."
    Push-Location $appDir
    pnpm run e2e:build
    $buildExit = $LASTEXITCODE
    Pop-Location
    if ($buildExit -ne 0) {
        Exit-WithError $buildExit 'ERROR: Unable to build the packaged renderer. Halting rescue kit.'
    }

    $rendererIndex = Join-Path $appDir 'dist/index.html'
    $mainEntry = Join-Path $appDir 'dist-electron/main/main.js'
    if (-not (Test-Path $rendererIndex)) {
        Exit-WithError 1 "ERROR: $rendererIndex is missing even after the build. Check the Vite output."
    }
    if (-not (Test-Path $mainEntry)) {
        Exit-WithError 1 "ERROR: $mainEntry is missing even after the build. Check the main process compilation."
    }

    function List-TestDirs {
        if (-not (Test-Path $testResultsDir)) {
            return @()
        }
        return Get-ChildItem -Path $testResultsDir -Directory | Sort-Object Name
    }

    function Print-NewTraces($before, $after, $label) {
        $beforeNames = $before | ForEach-Object { $_.Name }
        $newDirs = $after | Where-Object { $beforeNames -notcontains $_.Name }
        if (-not $newDirs) {
            Write-Host "   [$label] No new trace directories detected."
            return
        }

        foreach ($dir in $newDirs) {
            $traceZip = Join-Path $dir.FullName 'trace.zip'
            if (Test-Path $traceZip) {
                Write-Host "   Trace captured for ${label}: $traceZip"
                Write-Host "   Open it with: pnpm exec playwright show-trace `"$traceZip`" (run from app/)."
            } else {
                Write-Host "   Trace output for $label lives under $($dir.FullName) but trace.zip was not found."
            }
        }
    }

    function Run-Spec($label, $relativePath) {
        Write-Host "`nRunning $label (`$relativePath`)..."
        $beforeDirs = List-TestDirs

        Push-Location $appDir
        pnpm exec playwright test $relativePath --trace=on --workers=1 --reporter=list
        $testExit = $LASTEXITCODE
        Pop-Location

        if ($testExit -ne 0) {
            Print-NewTraces $beforeDirs (List-TestDirs) $label
            Exit-WithError $testExit "ERROR: Playwright $label run failed with exit code $testExit."
        }

        Print-NewTraces $beforeDirs (List-TestDirs) $label
    }

    if (-not $SkipSmokeTest) {
        Run-Spec 'smoke gate' 'tests/e2e/smoke.project.spec.ts'
    }
    Run-Spec 'Insights' 'tests/e2e/gui.insights.spec.ts'

    Write-Host "`nRescue kit finished. If you still get a blank window, open the latest trace.zip and check [renderer] logs."
} finally {
    Pop-Location
}
