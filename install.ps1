Param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ArgsList
)

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Mode = "full"
$TargetPath = ""
$PackDir = "exmachina"
$Lang = ""
$LangSuffix = ""
$PackOverride = $false
$IntakePath = ""
$AllowMissing = $false
$DryRun = $false
$NoBackup = $false

for ($i = 0; $i -lt $ArgsList.Count; $i++) {
  $arg = $ArgsList[$i]
  switch ($arg) {
    "--mode" {
      if ($i + 1 -ge $ArgsList.Count) {
        Write-Error "Missing value for --mode"
        exit 1
      }
      $Mode = $ArgsList[$i + 1]
      $i++
    }
    "--pack" {
      if ($i + 1 -ge $ArgsList.Count) {
        Write-Error "Missing value for --pack"
        exit 1
      }
      $PackDir = $ArgsList[$i + 1]
      $PackOverride = $true
      $i++
    }
    "--lang" {
      if ($i + 1 -ge $ArgsList.Count) {
        Write-Error "Missing value for --lang"
        exit 1
      }
      $Lang = $ArgsList[$i + 1]
      $i++
    }
    "--intake" {
      if ($i + 1 -ge $ArgsList.Count) {
        Write-Error "Missing value for --intake"
        exit 1
      }
      $IntakePath = $ArgsList[$i + 1]
      $i++
    }
    "--target" {
      if ($i + 1 -ge $ArgsList.Count) {
        Write-Error "Missing value for --target"
        exit 1
      }
      $TargetPath = $ArgsList[$i + 1]
      $i++
    }
    "--allow-missing" { $AllowMissing = $true }
    "--dry-run" { $DryRun = $true }
    "--dryrun" { $DryRun = $true }
    "--dry" { $DryRun = $true }
    "--no-backup" { $NoBackup = $true }
    "lite" { $Mode = "lite" }
    "full" { $Mode = "full" }
    default { $TargetPath = $arg }
  }
}

if (-not [string]::IsNullOrWhiteSpace($Lang)) {
  switch ($Lang) {
    "en" { $LangSuffix = ".en" }
    "en-US" { $LangSuffix = ".en" }
    "en_US" { $LangSuffix = ".en" }
  }
}

if (-not [string]::IsNullOrWhiteSpace($Lang) -and -not $PackOverride) {
  switch ($Lang) {
    "en" { $PackDir = "exmachina-en" }
    "en-US" { $PackDir = "exmachina-en" }
    "en_US" { $PackDir = "exmachina-en" }
  }
}

if ([string]::IsNullOrWhiteSpace($LangSuffix)) {
  if ($PackDir -like "*-en") {
    $LangSuffix = ".en"
  }
}

switch ($Mode) {
  "lite" { $SettingsFile = Join-Path $RootDir "$PackDir/openclaw.settings.lite.json" }
  "full" { $SettingsFile = Join-Path $RootDir "$PackDir/openclaw.settings.json" }
  default {
    Write-Error "Unknown mode: $Mode"
    Write-Host "Usage: .\\install.ps1 [--mode lite|full] [--pack exmachina|exmachina-en] [--lang zh|en] <target-config-path>"
    exit 1
  }
}

if (-not (Test-Path $SettingsFile)) {
  Write-Error "Missing: $SettingsFile"
  exit 1
}

$IntakeFile = Join-Path $RootDir ("install\\INTAKE{0}.md" -f $LangSuffix)
$BootstrapFile = Join-Path $RootDir ("{0}\\BOOTSTRAP.md" -f $PackDir)
$ApplyScript = Join-Path $RootDir "install\\apply-openclaw-settings.js"
if ([string]::IsNullOrWhiteSpace($IntakePath)) {
  $IntakePath = Join-Path $RootDir ("install\\intake.template{0}.json" -f $LangSuffix)
}

Write-Host "ExMachina Prompt-First Install"
Write-Host "1) Read: $IntakeFile"
Write-Host "2) Select mode: $Mode"
Write-Host "3) Apply: $SettingsFile via $ApplyScript (merge ExMachina agent entries; set exmachina-main as default)"
Write-Host "4) Follow: $BootstrapFile"
Write-Host ""

if ([string]::IsNullOrWhiteSpace($TargetPath)) {
  Write-Host "Note: No target path provided; using target_config_path from $IntakePath."
  Write-Host "Usage: .\\install.ps1 [--mode lite|full] [--pack exmachina|exmachina-en] [--lang zh|en] [--intake <path>] [--target <path>]"
}

if (-not (Test-Path $ApplyScript)) {
  Write-Error "Missing: $ApplyScript"
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js not found. Please install Node.js or merge settings manually."
  exit 1
}

$ExtraArgs = @()
if ($AllowMissing) { $ExtraArgs += "--allow-missing" }
if ($DryRun) { $ExtraArgs += "--dry-run" }
if ($NoBackup) { $ExtraArgs += "--no-backup" }

$TargetArgs = @()
if (-not [string]::IsNullOrWhiteSpace($TargetPath)) {
  $TargetArgs += "--target"
  $TargetArgs += $TargetPath
}

& node $ApplyScript --mode $Mode --pack $PackDir --lang $Lang --intake $IntakePath @TargetArgs @ExtraArgs
exit $LASTEXITCODE
