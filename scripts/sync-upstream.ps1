<#
.SYNOPSIS
    Sync vue-vben-admin upstream code
.DESCRIPTION
    Strategy (no sparse-checkout, safe):
      1. git fetch + git merge --no-commit
      2. Remove unneeded upstream modules (web-antd, web-ele, etc.)
      3. Restore apps/web-antdv-next to local version (keep all our code)
      4. Framework core (packages, internal, etc.) merged normally
      5. Show remaining conflicts for manual resolution
.PARAMETER Branch
    Upstream branch or tag, default main
.PARAMETER DryRun
    Preview only, no actual changes
.PARAMETER SkipBackup
    Skip creating backup branch
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\sync-upstream.ps1
    powershell -ExecutionPolicy Bypass -File .\scripts\sync-upstream.ps1 -Branch "v5.7.0"
    powershell -ExecutionPolicy Bypass -File .\scripts\sync-upstream.ps1 -DryRun
#>
param(
    [string]$Branch = "main",
    [switch]$DryRun,
    [switch]$SkipBackup
)
$ErrorActionPreference = "Stop"

# ======================== Config ========================
$GIT_ROOT = git rev-parse --show-toplevel 2>$null
if (-not $GIT_ROOT) {
    Write-Host "[ERR] Not in a git repo" -ForegroundColor Red
    exit 1
}
Set-Location $GIT_ROOT

# Upstream dirs to DELETE after merge (not used in your project)
$REMOVE_DIRS = @(
    "apps/web-antd",
    "apps/web-ele",
    "apps/web-naive",
    "apps/web-tdesign",
    "playground"
)

# Local dirs to KEEP as-is (restore to pre-merge state after merge)
$KEEP_LOCAL = @(
    "apps/web-antdv-next"
)

# ======================== Main ========================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Vben Admin Upstream Sync Tool" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$currentBranch = git branch --show-current
$pkg = Get-Content (Join-Path $GIT_ROOT "package.json") -Raw | ConvertFrom-Json
Write-Host "  Repo:    $GIT_ROOT"
Write-Host "  Branch:  $currentBranch"
Write-Host "  Version: v$($pkg.version)"
Write-Host "  Target:  origin/$Branch"
if ($DryRun) {
    Write-Host "  Mode:    [PREVIEW]" -ForegroundColor Yellow
} else {
    Write-Host "  Mode:    [SYNC]" -ForegroundColor Green
}

# ---- Step 1: Check workspace ----
Write-Host ""
Write-Host "--- Step 1/5: Check workspace ---" -ForegroundColor Cyan
$dirty = git status --porcelain
if ($dirty) {
    Write-Host "  [WARN] Uncommitted changes:" -ForegroundColor Yellow
    $dirty | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    $ans = Read-Host "  Recommend commit first. Continue? (y/N)"
    if ($ans -ne 'y' -and $ans -ne 'Y') {
        Write-Host "  Cancelled"
        exit 0
    }
} else {
    Write-Host "  [OK] Workspace clean" -ForegroundColor Green
}

if ($DryRun) {
    Write-Host ""
    Write-Host "  [PREVIEW] Steps that will execute:" -ForegroundColor Yellow
    Write-Host "    1. git fetch origin $Branch"
    Write-Host "    2. Create backup branch"
    Write-Host "    3. git merge --no-commit origin/$Branch"
    Write-Host "    4. Remove: $($REMOVE_DIRS -join ', ')"
    Write-Host "    5. Restore local: $($KEEP_LOCAL -join ', ')"
    Write-Host "    6. Commit merge"
    Write-Host ""
    Write-Host "  Run without -DryRun to execute" -ForegroundColor Yellow
    exit 0
}

# ---- Step 2: Fetch ----
Write-Host ""
Write-Host "--- Step 2/5: Fetch upstream ---" -ForegroundColor Cyan
git fetch origin $Branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERR] Fetch failed" -ForegroundColor Red
    exit 1
}
$upPkgJson = git show "origin/${Branch}:package.json" 2>$null
if ($upPkgJson) {
    $upPkg = $upPkgJson | ConvertFrom-Json
    Write-Host "  [OK] Upstream: v$($upPkg.version)  Local: v$($pkg.version)" -ForegroundColor Green
} else {
    Write-Host "  [ERR] Cannot read upstream version" -ForegroundColor Red
    exit 1
}

# ---- Step 3: Backup + Merge ----
Write-Host ""
Write-Host "--- Step 3/5: Backup and merge ---" -ForegroundColor Cyan

$bak = ""
if (-not $SkipBackup) {
    $bak = "backup/vben-sync-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    git branch $bak
    Write-Host "  [OK] Backup branch: $bak" -ForegroundColor Green
}

Write-Host "  Merging origin/$Branch (--no-commit) ..." -ForegroundColor Gray
git merge --no-commit "origin/$Branch" 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
$mergeCode = $LASTEXITCODE

# ---- Step 4: Clean up unwanted dirs + restore local ----
Write-Host ""
Write-Host "--- Step 4/5: Remove unwanted dirs, restore local code ---" -ForegroundColor Cyan

# Remove dirs that our project doesn't use
foreach ($dir in $REMOVE_DIRS) {
    if (Test-Path (Join-Path $GIT_ROOT $dir)) {
        git rm -rf --quiet -- $dir 2>$null
        Write-Host "  [DEL] $dir" -ForegroundColor Yellow
    }
}

# Restore local dirs to pre-merge state (keep ALL our code)
foreach ($local in $KEEP_LOCAL) {
    git checkout HEAD -- $local 2>$null
    if ($LASTEXITCODE -eq 0) {
        git add -- $local 2>$null
        Write-Host "  [KEEP] $local -> restored to local version" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Could not restore $local, may need manual resolve" -ForegroundColor Yellow
    }
}

# ---- Step 5: Check conflicts and commit ----
Write-Host ""
Write-Host "--- Step 5/5: Finalize ---" -ForegroundColor Cyan

$remaining = git diff --name-only --diff-filter=U 2>$null
if ($remaining) {
    Write-Host "  [WARN] Remaining conflicts (manual resolve needed):" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "  After resolving:" -ForegroundColor White
    Write-Host "    git add ." -ForegroundColor White
    Write-Host "    git commit" -ForegroundColor White
} else {
    $commitMsg = "chore: sync upstream vben-admin v$($upPkg.version)"
    git commit -m $commitMsg 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Committed: $commitMsg" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Nothing to commit (already up to date?)" -ForegroundColor Gray
    }
}

# Summary
Write-Host ""
$newPkg = Get-Content (Join-Path $GIT_ROOT "package.json") -Raw | ConvertFrom-Json
Write-Host "  Version: v$($pkg.version) -> v$($newPkg.version)" -ForegroundColor White
Write-Host "  [TIP] Run: pnpm install" -ForegroundColor Yellow
if ($bak) {
    Write-Host "  [TIP] Rollback: git reset --hard $bak" -ForegroundColor Yellow
}
Write-Host ""
