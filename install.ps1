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

Write-Host "ExMachina Prompt-First Install"
Write-Host "1) Read: $IntakeFile"
Write-Host "2) Select mode: $Mode"
Write-Host "3) Import: $SettingsFile (merge ExMachina agent entries; set exmachina-main as default)"
Write-Host "4) Follow: $BootstrapFile"
Write-Host ""

if ([string]::IsNullOrWhiteSpace($TargetPath)) {
  Write-Host "Tip: You can copy the settings template into your OpenClaw config path."
  Write-Host "Usage: .\\install.ps1 [--mode lite|full] [--pack exmachina|exmachina-en] [--lang zh|en] <target-config-path>"
  exit 0
}

$TargetDir = Split-Path -Parent $TargetPath
if (-not [string]::IsNullOrWhiteSpace($TargetDir)) {
  New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

if (Test-Path $TargetPath) {
  $BackupPath = "$TargetPath.exmachina.bak"
  Copy-Item -Path $TargetPath -Destination $BackupPath -Force
  Write-Host "Backup created: $BackupPath"
}

Copy-Item -Path $SettingsFile -Destination $TargetPath -Force
Write-Host "Copied settings template to: $TargetPath"
Write-Host "Note: This replaces the target file; merge manually if needed."
