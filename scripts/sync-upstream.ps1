<#
.SYNOPSIS
    同步 vue-vben-admin 上游最新代码
.DESCRIPTION
    WebClient/admin/ 是 vue-vben-admin 的独立 Git 仓库
    origin -> https://github.com/vbenjs/vue-vben-admin.git

    策略:
      - sparse-checkout 直接忽略不需要的上游模块 (根本不拉下来)
      - apps/web-antdv-next 冲突时保留本地全部代码 (ours)
      - 框架核心 (packages, internal 等) 正常合并
.PARAMETER Branch
    上游分支或标签, 默认 main
.PARAMETER DryRun
    仅预览, 不实际操作
.PARAMETER SkipBackup
    跳过创建备份分支
.EXAMPLE
    .\scripts\sync-upstream.ps1
    .\scripts\sync-upstream.ps1 -Branch "v5.7.0"
    .\scripts\sync-upstream.ps1 -DryRun
#>
param(
    [string]$Branch = "main",
    [switch]$DryRun,
    [switch]$SkipBackup
)
$ErrorActionPreference = "Stop"

# ======================== 配置 ========================
$GIT_ROOT = git rev-parse --show-toplevel 2>$null
if (-not $GIT_ROOT) {
    Write-Host "[ERR] 请在 WebClient/admin Git 仓库下运行" -Fore Red; exit 1
}
Set-Location $GIT_ROOT

# sparse-checkout 直接忽略 (根本不会出现在工作区)
$SPARSE_EXCLUDE = @(
    "apps/web-antd",
    "apps/web-ele",
    "apps/web-naive",
    "apps/web-tdesign",
    "playground"
)

# 合并时保留本地的路径 (整个 web-antdv-next 保留 ours)
$KEEP_OURS = @(
    "apps/web-antdv-next"
)

# ======================== 工具函数 ========================
function Write-Step([string]$N,[string]$M) {
    Write-Host "`n━━━ Step $N $M ━━━" -Fore Cyan
}

# ======================== 主流程 ========================
Write-Host ""
Write-Host "========================================" -Fore Magenta
Write-Host "  Vben Admin 上游同步工具" -Fore Magenta
Write-Host "========================================" -Fore Magenta

$currentBranch = git branch --show-current
$pkg = Get-Content (Join-Path $GIT_ROOT "package.json") -Raw | ConvertFrom-Json
Write-Host "  仓库: $GIT_ROOT"
Write-Host "  分支: $currentBranch"
Write-Host "  版本: v$($pkg.version)"
Write-Host "  目标: origin/$Branch"
Write-Host "  模式: $(if($DryRun){'[预览]'}else{'[同步]'})" -Fore $(if($DryRun){'Yellow'}else{'Green'})

# ---- Step 1: 检查工作区 ----
Write-Step "1/6" "检查工作区"
$dirty = git status --porcelain
if ($dirty) {
    Write-Host "  [WARN] 有未提交更改:" -Fore Yellow
    $dirty | ForEach-Object { Write-Host "    $_" -Fore Yellow }
    $ans = Read-Host "  建议先提交。继续? (y/N)"
    if ($ans -ne 'y' -and $ans -ne 'Y') { Write-Host "  已取消"; exit 0 }
} else {
    Write-Host "  [OK] 工作区干净" -Fore Green
}

if ($DryRun) {
    Write-Host "`n  [预览] 将执行:" -Fore Yellow
    Write-Host "    1. sparse-checkout 排除: $($SPARSE_EXCLUDE -join ', ')"
    Write-Host "    2. git fetch origin $Branch"
    Write-Host "    3. 创建备份分支"
    Write-Host "    4. git merge --no-commit origin/$Branch"
    Write-Host "    5. apps/web-antdv-next 冲突保留本地 (ours)"
    Write-Host "    6. 手动解决剩余冲突"
    Write-Host "`n  运行不带 -DryRun 来执行" -Fore Yellow
    exit 0
}

# ---- Step 2: sparse-checkout ----
Write-Step "2/6" "配置 sparse-checkout (忽略不需要的模块)"
git sparse-checkout init 2>$null
git config core.sparseCheckoutCone false
$sparseFile = Join-Path $GIT_ROOT ".git/info/sparse-checkout"
$lines = @("/*")
foreach ($exc in $SPARSE_EXCLUDE) { $lines += "!/$exc/" }
$lines | Set-Content $sparseFile -Encoding UTF8
git read-tree -mu HEAD 2>$null
Write-Host "  [OK] 已忽略: $($SPARSE_EXCLUDE -join ', ')" -Fore Green

# ---- Step 3: Fetch ----
Write-Step "3/6" "拉取上游最新代码"
git fetch origin $Branch 2>&1 | ForEach-Object { Write-Host "    $_" -Fore Gray }
$upstreamPkg = git show "origin/$($Branch):package.json" 2>$null | ConvertFrom-Json
if ($upstreamPkg) {
    Write-Host "  [OK] 上游版本: v$($upstreamPkg.version)" -Fore Green
} else {
    Write-Host "  [ERR] 无法读取上游版本" -Fore Red; exit 1
}

# ---- Step 4: 备份 ----
Write-Step "4/6" "创建备份分支"
if (-not $SkipBackup) {
    $bak = "backup/vben-sync-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    git branch $bak 2>$null
    Write-Host "  [OK] 备份: $bak (基于 $currentBranch)" -Fore Green
} else {
    Write-Host "  [SKIP] 跳过备份" -Fore Yellow
}

# ---- Step 5: 合并 ----
Write-Step "5/6" "合并上游代码 (apps/web-antdv-next 保留本地)"

# 配置 .gitattributes 让 web-antdv-next 使用 ours 策略
$attrFile = Join-Path $GIT_ROOT ".gitattributes"
$attrMarker = "# --- sync-upstream auto-generated ---"
$attrLines = @($attrMarker)
foreach ($p in $KEEP_OURS) {
    $attrLines += "$p/** merge=ours"
}
$attrLines += "# --- end sync-upstream ---"

# 写入或更新 .gitattributes
$existingAttr = ""
if (Test-Path $attrFile) { $existingAttr = Get-Content $attrFile -Raw }
if ($existingAttr -notmatch [regex]::Escape($attrMarker)) {
    # 追加
    Add-Content $attrFile -Value ("`n" + ($attrLines -join "`n"))
}

# 注册 ours 合并驱动
git config merge.ours.driver "true"

# 执行合并 (--no-commit 以便处理冲突)
Write-Host "  执行: git merge --no-commit origin/$Branch ..." -Fore Gray
$mergeResult = git merge --no-commit "origin/$Branch" 2>&1
$mergeExitCode = $LASTEXITCODE
$mergeOutput = $mergeResult | Out-String
Write-Host $mergeOutput -Fore Gray

if ($mergeExitCode -ne 0) {
    # 有冲突 - 对 KEEP_OURS 路径自动解决
    Write-Host "  [INFO] 检测到冲突, 处理 KEEP_OURS 路径..." -Fore Yellow
    foreach ($keepPath in $KEEP_OURS) {
        $fullKeep = Join-Path $GIT_ROOT $keepPath
        if (Test-Path $fullKeep) {
            git checkout --ours -- $keepPath 2>$null
            git add -- $keepPath 2>$null
            Write-Host "  [OK] $keepPath -> 保留本地" -Fore Green
        }
    }

    # 检查剩余冲突
    $remaining = git diff --name-only --diff-filter=U 2>$null
    if ($remaining) {
        Write-Host ""
        Write-Host "  [WARN] 以下文件仍有冲突, 需手动解决:" -Fore Yellow
        $remaining | ForEach-Object { Write-Host "    $_" -Fore Yellow }
        Write-Host ""
        Write-Host "  手动解决后执行:" -Fore White
        Write-Host "    git add ." -Fore White
        Write-Host "    git commit" -Fore White
    } else {
        Write-Host "  [OK] 所有冲突已自动解决" -Fore Green
        git commit -m "chore: sync upstream vben-admin v$($upstreamPkg.version)" 2>$null
        Write-Host "  [OK] 已提交合并" -Fore Green
    }
} else {
    # 无冲突, 直接提交
    git commit -m "chore: sync upstream vben-admin v$($upstreamPkg.version)" 2>$null
    Write-Host "  [OK] 合并成功, 无冲突" -Fore Green
}

# 清理临时 .gitattributes 修改
git checkout -- .gitattributes 2>$null

# ---- Step 6: 总结 ----
Write-Step "6/6" "同步完成"
$newPkg = Get-Content (Join-Path $GIT_ROOT "package.json") -Raw | ConvertFrom-Json
Write-Host "  版本: v$($pkg.version) -> v$($newPkg.version)" -Fore White
Write-Host ""
Write-Host "  变更概览:" -Fore White
$stats = git diff --stat "HEAD~1..HEAD" 2>$null
if ($stats) { $stats | ForEach-Object { Write-Host "    $_" -Fore Gray } }
Write-Host ""
Write-Host "  [提示] 请运行 pnpm install 更新依赖" -Fore Yellow
Write-Host "  [提示] 如需回滚: git reset --hard $bak" -Fore Yellow
Write-Host ""
