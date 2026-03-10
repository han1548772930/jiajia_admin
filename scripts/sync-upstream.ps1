<#
.SYNOPSIS
    Sync vue-vben-admin upstream code
.DESCRIPTION
    WebClient/admin/ is a standalone Git repo cloned from vue-vben-admin.
    origin -> https://github.com/vbenjs/vue-vben-admin.git

    Strategy:
      - sparse-checkout to ignore unneeded upstream modules (never pulled)
      - apps/web-antdv-next conflicts resolved as ours (keep local)
      - Framework core (packages, internal, etc.) merged normally
.PARAMETER Branch
    Upstream branch or tag, default main
.PARAMETER DryRun
    Preview only, no actual changes
.PARAMETER SkipBackup
    Skip creating backup branch
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
    Write-Host "[ERR] Please run in WebClient/admin Git repo" -Fore Red
    exit 1
}
Set-Location $GIT_ROOT

$SPARSE_EXCLUDE = @(
    "apps/web-antd",
    "apps/web-ele",
    "apps/web-naive",
    "apps/web-tdesign",
    "playground"
)

$KEEP_OURS = @(
    "apps/web-antdv-next"
)

# ======================== Utils ========================
function Write-Step {
    param([string]$Num, [string]$Msg)
    Write-Host ""
    Write-Host "--- Step $Num $Msg ---" -ForegroundColor Cyan
}

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

# ---- Step 1 ----
Write-Step -Num "1/6" -Msg "Check workspace"
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
    Write-Host "  [PREVIEW] Will execute:" -ForegroundColor Yellow
    Write-Host "    1. sparse-checkout exclude: $($SPARSE_EXCLUDE -join ', ')"
    Write-Host "    2. git fetch origin $Branch"
    Write-Host "    3. Create backup branch"
    Write-Host "    4. git merge --no-commit origin/$Branch"
    Write-Host "    5. apps/web-antdv-next conflicts keep ours"
    Write-Host "    6. Manually resolve remaining conflicts"
    Write-Host ""
    Write-Host "  Run without -DryRun to execute" -ForegroundColor Yellow
    exit 0
}

# ---- Step 2 ----
Write-Step -Num "2/6" -Msg "Configure sparse-checkout (ignore unneeded modules)"
git sparse-checkout init 2>$null
git config core.sparseCheckoutCone false
$sparseFile = Join-Path $GIT_ROOT ".git" "info" "sparse-checkout"
$sparseLines = @("/*")
foreach ($exc in $SPARSE_EXCLUDE) {
    $sparseLines += "!/$exc/"
}
$sparseLines | Set-Content -Path $sparseFile -Encoding UTF8
git read-tree -mu HEAD 2>$null
Write-Host "  [OK] Excluded: $($SPARSE_EXCLUDE -join ', ')" -ForegroundColor Green

# ---- Step 3 ----
Write-Step -Num "3/6" -Msg "Fetch upstream"
git fetch origin $Branch 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
$upPkgJson = git show "origin/${Branch}:package.json" 2>$null
if ($upPkgJson) {
    $upPkg = $upPkgJson | ConvertFrom-Json
    Write-Host "  [OK] Upstream version: v$($upPkg.version)" -ForegroundColor Green
} else {
    Write-Host "  [ERR] Cannot read upstream version" -ForegroundColor Red
    exit 1
}

# ---- Step 4 ----
Write-Step -Num "4/6" -Msg "Create backup branch"
$bak = ""
if (-not $SkipBackup) {
    $bak = "backup/vben-sync-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    git branch $bak 2>$null
    Write-Host "  [OK] Backup: $bak" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] Backup skipped" -ForegroundColor Yellow
}

# ---- Step 5 ----
Write-Step -Num "5/6" -Msg "Merge upstream (apps/web-antdv-next keep ours)"

# Register ours merge driver
git config merge.ours.driver "true"

# Setup .gitattributes for ours merge
$attrFile = Join-Path $GIT_ROOT ".gitattributes"
$marker = "# --- sync-upstream-ours ---"
$attrBlock = @($marker)
foreach ($p in $KEEP_OURS) {
    $attrBlock += "$p/** merge=ours"
}
$attrBlock += "# --- end-sync-upstream ---"

$existingAttr = ""
if (Test-Path $attrFile) {
    $existingAttr = Get-Content $attrFile -Raw -ErrorAction SilentlyContinue
}
if (-not $existingAttr -or $existingAttr.IndexOf($marker) -lt 0) {
    $nl = [Environment]::NewLine
    $blockText = $nl + ($attrBlock -join $nl) + $nl
    Add-Content -Path $attrFile -Value $blockText
}

# Merge
Write-Host "  Running: git merge --no-commit origin/$Branch ..." -ForegroundColor Gray
$mergeOut = git merge --no-commit "origin/$Branch" 2>&1
$mergeCode = $LASTEXITCODE
$mergeOut | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }

if ($mergeCode -ne 0) {
    Write-Host "  [INFO] Conflicts detected, resolving KEEP_OURS paths..." -ForegroundColor Yellow
    foreach ($kp in $KEEP_OURS) {
        $kpFull = Join-Path $GIT_ROOT $kp
        if (Test-Path $kpFull) {
            git checkout --ours -- $kp 2>$null
            git add -- $kp 2>$null
            Write-Host "  [OK] $kp -> keep ours" -ForegroundColor Green
        }
    }

    $remaining = git diff --name-only --diff-filter=U 2>$null
    if ($remaining) {
        Write-Host ""
        Write-Host "  [WARN] These files still have conflicts:" -ForegroundColor Yellow
        $remaining | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
        Write-Host ""
        Write-Host "  After resolving manually:" -ForegroundColor White
        Write-Host "    git add ." -ForegroundColor White
        Write-Host "    git commit" -ForegroundColor White
    } else {
        Write-Host "  [OK] All conflicts auto-resolved" -ForegroundColor Green
        git commit -m "chore: sync upstream vben-admin v$($upPkg.version)" 2>$null
        Write-Host "  [OK] Merge committed" -ForegroundColor Green
    }
} else {
    git commit -m "chore: sync upstream vben-admin v$($upPkg.version)" 2>$null
    Write-Host "  [OK] Merge success, no conflicts" -ForegroundColor Green
}

# Restore .gitattributes
git checkout -- .gitattributes 2>$null

# ---- Step 6 ----
Write-Step -Num "6/6" -Msg "Done"
$newPkg = Get-Content (Join-Path $GIT_ROOT "package.json") -Raw | ConvertFrom-Json
Write-Host "  Version: v$($pkg.version) -> v$($newPkg.version)" -ForegroundColor White
Write-Host ""
$stats = git diff --stat "HEAD~1..HEAD" 2>$null
if ($stats) {
    Write-Host "  Changes:" -ForegroundColor White
    $stats | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
}
Write-Host ""
Write-Host "  [TIP] Run: pnpm install" -ForegroundColor Yellow
if ($bak) {
    Write-Host "  [TIP] Rollback: git reset --hard $bak" -ForegroundColor Yellow
}
Write-Host ""
