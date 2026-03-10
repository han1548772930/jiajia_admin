<#
.SYNOPSIS
    Sync vue-vben-admin upstream code
.DESCRIPTION
    Strategy (safe, true ignore):
      1. git fetch + git merge --no-commit
      2. Ignore unneeded modules (web-antd, web-ele, etc.) via git reset
      3. Ignore apps/web-antdv-next changes - keep all local code
      4. Framework core (packages, internal, etc.) merged normally
      5. Show remaining conflicts for manual resolution
    Ignored paths are completely excluded from the merge commit.
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

# All paths to IGNORE during merge (changes in these paths won't appear in commit)
$IGNORE_PATHS = @(
    "apps/web-antd",
    "apps/web-ele",
    "apps/web-naive",
    "apps/web-tdesign",
    "playground",
    "apps/web-antdv-next",
    "pnpm-lock.yaml"
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
    Write-Host "    4. Ignore paths: $($IGNORE_PATHS -join ', ')"
    Write-Host "    5. Commit merge"
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

# ---- Step 4: Ignore unwanted paths (completely exclude from commit) ----
Write-Host ""
Write-Host "--- Step 4/5: Ignore excluded paths ---" -ForegroundColor Cyan

$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

foreach ($p in $IGNORE_PATHS) {
    # 1) Reset index: undo all staged changes for this path
    git reset HEAD -- $p 2>&1 | Out-Null

    # 2) Restore files that existed before merge to their original state
    git checkout -- $p 2>&1 | Out-Null

    # 3) Remove any NEW files that upstream added (not tracked before merge)
    git clean -fd -- $p 2>&1 | Out-Null

    Write-Host "  [SKIP] $p -> ignored (excluded from merge)" -ForegroundColor DarkGray
}

$ErrorActionPreference = $oldEAP

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
try {
    $newPkg = Get-Content (Join-Path $GIT_ROOT "package.json") -Raw | ConvertFrom-Json
    Write-Host "  Version: v$($pkg.version) -> v$($newPkg.version)" -ForegroundColor White
} catch {
    Write-Host "  Version: v$($pkg.version) -> (package.json has conflicts, resolve first)" -ForegroundColor Yellow
}
Write-Host "  [TIP] Run: pnpm install" -ForegroundColor Yellow
if ($bak) {
    Write-Host "  [TIP] Rollback: git reset --hard $bak" -ForegroundColor Yellow
}
Write-Host ""
