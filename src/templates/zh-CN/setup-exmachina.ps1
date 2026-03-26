[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$CodexHome = (Join-Path $HOME ".codex"),
  [switch]$Force,
  [switch]$Verify,
  [switch]$Uninstall,
  [switch]$InstallGuidance,
  [switch]$RemoveGuidance,
  [ValidateSet("zh", "en")]
  [string]$GuidanceLanguage = "zh"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  param([string]$StartDirectory)

  $candidates = @(
    (Join-Path $StartDirectory ".."),
    (Join-Path $StartDirectory "..\..")
  )

  foreach ($candidate in $candidates) {
    $resolved = (Resolve-Path -LiteralPath $candidate).Path
    if (
      (Test-Path -LiteralPath (Join-Path $resolved "skills")) -and
      (Test-Path -LiteralPath (Join-Path $resolved "agents"))
    ) {
      return $resolved
    }
  }

  throw "[ExMachina] cannot locate repository root from $StartDirectory"
}

function Get-InstallableAgentFiles {
  param([string]$AgentsSource)

  Get-ChildItem -LiteralPath $AgentsSource -File -Filter *.md |
    Where-Object { $_.Name -match '^\d{2}_.*\.md$' } |
    Sort-Object Name
}

function Test-LooksLikeExMachinaAgent {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    return $false
  }

  $sample = (Get-Content -LiteralPath $Path -TotalCount 5) -join "`n"
  return $sample -match "ExMachina"
}

function Test-SameFileContent {
  param(
    [string]$LeftPath,
    [string]$RightPath
  )

  if (
    -not (Test-Path -LiteralPath $LeftPath -PathType Leaf) -or
    -not (Test-Path -LiteralPath $RightPath -PathType Leaf)
  ) {
    return $false
  }

  return (Get-FileHash -LiteralPath $LeftPath -Algorithm SHA256).Hash -eq
    (Get-FileHash -LiteralPath $RightPath -Algorithm SHA256).Hash
}

function Remove-ReparseDirectory {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  & cmd.exe /c "rmdir `"$Path`"" | Out-Null
  if (Test-Path -LiteralPath $Path) {
    throw "[ExMachina] failed to remove link path: $Path"
  }
}

function Remove-SkillsInstallSurface {
  param(
    [string]$InstallPath,
    [bool]$ForceRemoval
  )

  if (-not (Test-Path -LiteralPath $InstallPath)) {
    return
  }

  $item = Get-Item -LiteralPath $InstallPath -Force
  $isReparsePoint = (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)
  $markerPath = Join-Path $InstallPath ".exmachina-managed.txt"
  $isManaged = $isReparsePoint -or (Test-Path -LiteralPath $markerPath)

  if (-not $isManaged -and -not $ForceRemoval) {
    throw "[ExMachina] target already exists and is not a managed ExMachina install: $InstallPath`n[ExMachina] remove it manually or rerun with -Force if replacement is intended."
  }

  if ($isReparsePoint) {
    Remove-ReparseDirectory -Path $InstallPath
  } else {
    Remove-Item -LiteralPath $InstallPath -Recurse -Force
  }
}

function Remove-ManagedAgents {
  param(
    [string]$AgentsRoot,
    [string]$AgentManifestPath,
    [string]$AgentsSource,
    [bool]$ForceRemoval
  )

  New-Item -ItemType Directory -Force -Path $AgentsRoot | Out-Null

  if (Test-Path -LiteralPath $AgentManifestPath) {
    Get-Content -LiteralPath $AgentManifestPath |
      Where-Object { $_ } |
      ForEach-Object {
        $targetPath = Join-Path $AgentsRoot $_
        if (Test-Path -LiteralPath $targetPath) {
          Remove-Item -LiteralPath $targetPath -Recurse -Force
        }
      }

    Remove-Item -LiteralPath $AgentManifestPath -Force
    return
  }

  if (-not (Test-Path -LiteralPath $AgentsSource)) {
    return
  }

  foreach ($agentFile in Get-InstallableAgentFiles -AgentsSource $AgentsSource) {
    $targetPath = Join-Path $AgentsRoot $agentFile.Name
    if (-not (Test-Path -LiteralPath $targetPath)) {
      continue
    }

    if ($ForceRemoval -or (Test-LooksLikeExMachinaAgent -Path $targetPath)) {
      Remove-Item -LiteralPath $targetPath -Recurse -Force
    }
  }
}

function Get-GuidanceSourcePath {
  param(
    [string]$RepoRootPath,
    [string]$Language
  )

  switch ($Language) {
    "zh" { return (Join-Path $RepoRootPath ".codex\AGENTS.md") }
    "en" { return (Join-Path $RepoRootPath ".codex\AGENTS.en.md") }
    default { throw "[ExMachina] unsupported guidance language: $Language" }
  }
}

function Get-GuidanceWithoutManagedBlock {
  param(
    [string]$GuidancePath,
    [string]$GuidanceBegin,
    [string]$GuidanceEnd
  )

  if (-not (Test-Path -LiteralPath $GuidancePath)) {
    return ""
  }

  $content = Get-Content -LiteralPath $GuidancePath -Raw
  $pattern = "(?ms)^\Q$GuidanceBegin\E\r?\n.*?^\Q$GuidanceEnd\E\r?\n?"
  return ([regex]::Replace($content, $pattern, "")).Trim()
}

function Assert-InstallState {
  param(
    [string]$InstallPath,
    [string]$AgentsRoot,
    [string]$AgentManifestPath
  )

  $verificationPath = Join-Path $InstallPath "using-exmachina\SKILL.md"
  if (-not (Test-Path -LiteralPath $verificationPath)) {
    throw "[ExMachina] verification failed: using-exmachina skill missing."
  }

  if (-not (Test-Path -LiteralPath $AgentManifestPath)) {
    throw "[ExMachina] verification failed: agents manifest missing."
  }

  if (-not (Get-ChildItem -LiteralPath $AgentsRoot -File -Filter "00_*.md" | Select-Object -First 1)) {
    throw "[ExMachina] verification failed: missing coordinator agent (00_*.md)."
  }

  if (-not (Get-ChildItem -LiteralPath $AgentsRoot -File -Filter "69_*.md" | Select-Object -First 1)) {
    throw "[ExMachina] verification failed: missing coding agent (69_*.md)."
  }

  Get-Content -LiteralPath $AgentManifestPath |
    Where-Object { $_ } |
    ForEach-Object {
      $targetPath = Join-Path $AgentsRoot $_
      if (-not (Test-Path -LiteralPath $targetPath)) {
        throw "[ExMachina] verification failed: managed agent missing: $_"
      }
    }
}

function Show-InstallSummary {
  param(
    [string]$InstallPath,
    [string]$AgentsRoot,
    [string]$AgentManifestPath
  )

  $agentCount = @()
  if (Test-Path -LiteralPath $AgentManifestPath) {
    $agentCount = @(Get-Content -LiteralPath $AgentManifestPath | Where-Object { $_ })
  }

  Write-Host "[ExMachina] verification ok"
  Write-Host "[ExMachina] skills path: $InstallPath"
  Write-Host "[ExMachina] agents path: $AgentsRoot"
  Write-Host "[ExMachina] managed agents: $($agentCount.Count)"
}

function Install-GuidanceBlock {
  param(
    [string]$GuidancePath,
    [string]$GuidanceSourcePath,
    [string]$GuidanceBegin,
    [string]$GuidanceEnd
  )

  if (-not (Test-Path -LiteralPath $GuidanceSourcePath)) {
    throw "[ExMachina] guidance source not found: $GuidanceSourcePath"
  }

  $existing = Get-GuidanceWithoutManagedBlock -GuidancePath $GuidancePath -GuidanceBegin $GuidanceBegin -GuidanceEnd $GuidanceEnd
  $sourceContent = (Get-Content -LiteralPath $GuidanceSourcePath -Raw).Trim()

  $finalContent = ""
  if (-not [string]::IsNullOrWhiteSpace($existing)) {
    $finalContent = $existing.TrimEnd() + "`r`n`r`n"
  }

  $finalContent += $GuidanceBegin + "`r`n" + $sourceContent + "`r`n" + $GuidanceEnd + "`r`n"
  Set-Content -LiteralPath $GuidancePath -Value $finalContent
  Write-Host "[ExMachina] installed managed guidance block at: $GuidancePath"
}

function Remove-GuidanceBlock {
  param(
    [string]$GuidancePath,
    [string]$GuidanceBegin,
    [string]$GuidanceEnd
  )

  if (-not (Test-Path -LiteralPath $GuidancePath)) {
    Write-Host "[ExMachina] no AGENTS.md guidance file found at: $GuidancePath"
    return
  }

  $cleanContent = Get-GuidanceWithoutManagedBlock -GuidancePath $GuidancePath -GuidanceBegin $GuidanceBegin -GuidanceEnd $GuidanceEnd
  if ([string]::IsNullOrWhiteSpace($cleanContent)) {
    Remove-Item -LiteralPath $GuidancePath -Force -ErrorAction SilentlyContinue
  } else {
    Set-Content -LiteralPath $GuidancePath -Value ($cleanContent.TrimEnd() + "`r`n")
  }

  Write-Host "[ExMachina] removed managed guidance block from: $GuidancePath"
}

$selectedModes = @(
  [bool]$Verify,
  [bool]$Uninstall,
  [bool]$InstallGuidance,
  [bool]$RemoveGuidance
) | Where-Object { $_ }

if ($selectedModes.Count -gt 1) {
  throw "[ExMachina] choose only one mode: -Verify, -Uninstall, -InstallGuidance, or -RemoveGuidance"
}

$scriptDirectory = Split-Path -Parent $PSCommandPath
if (-not $RepoRoot) {
  $RepoRoot = Resolve-RepoRoot -StartDirectory $scriptDirectory
}

$skillsSource = Join-Path $RepoRoot "skills"
if (-not (Test-Path -LiteralPath $skillsSource)) {
  throw "[ExMachina] skills directory not found: $skillsSource`n[ExMachina] run npm run generate if you are working from source."
}

$agentsSource = Join-Path $RepoRoot "agents"
if (-not (Test-Path -LiteralPath $agentsSource)) {
  throw "[ExMachina] agents directory not found: $agentsSource`n[ExMachina] run npm run generate if you are working from source."
}

$skillsRoot = Join-Path $CodexHome "skills"
$installPath = Join-Path $skillsRoot "exmachina"
$skillsMarkerPath = Join-Path $installPath ".exmachina-managed.txt"
$agentsRoot = Join-Path $CodexHome "agents"
$agentManifestPath = Join-Path $agentsRoot ".exmachina-installed-agents.txt"
$guidancePath = Join-Path $CodexHome "AGENTS.md"
$guidanceBegin = "# >>> ExMachina managed block >>>"
$guidanceEnd = "# <<< ExMachina managed block <<<"
$guidanceSourcePath = Get-GuidanceSourcePath -RepoRootPath $RepoRoot -Language $GuidanceLanguage

New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $agentsRoot | Out-Null

if ($Verify) {
  Assert-InstallState -InstallPath $installPath -AgentsRoot $agentsRoot -AgentManifestPath $agentManifestPath
  Show-InstallSummary -InstallPath $installPath -AgentsRoot $agentsRoot -AgentManifestPath $agentManifestPath
  return
}

if ($Uninstall) {
  if (Test-Path -LiteralPath $installPath) {
    Remove-SkillsInstallSurface -InstallPath $installPath -ForceRemoval $Force.IsPresent
  }

  Remove-ManagedAgents -AgentsRoot $agentsRoot -AgentManifestPath $agentManifestPath -AgentsSource $agentsSource -ForceRemoval $Force.IsPresent
  Write-Host "[ExMachina] removed ExMachina skills link and managed agents."
  return
}

if ($InstallGuidance) {
  Install-GuidanceBlock -GuidancePath $guidancePath -GuidanceSourcePath $guidanceSourcePath -GuidanceBegin $guidanceBegin -GuidanceEnd $guidanceEnd
  return
}

if ($RemoveGuidance) {
  Remove-GuidanceBlock -GuidancePath $guidancePath -GuidanceBegin $guidanceBegin -GuidanceEnd $guidanceEnd
  return
}

if (Test-Path -LiteralPath $installPath) {
  Remove-SkillsInstallSurface -InstallPath $installPath -ForceRemoval $Force.IsPresent
}

Copy-Item -LiteralPath $skillsSource -Destination $installPath -Recurse -Force
Set-Content -LiteralPath $skillsMarkerPath -Value "source=$RepoRoot"

$existingManagedNames = @()
if (Test-Path -LiteralPath $agentManifestPath) {
  $existingManagedNames = @(Get-Content -LiteralPath $agentManifestPath | Where-Object { $_ })
}

$agentFiles = @(Get-InstallableAgentFiles -AgentsSource $agentsSource)
if ($agentFiles.Count -eq 0) {
  throw "[ExMachina] no installable agent files found in $agentsSource"
}

$agentNames = $agentFiles.Name
foreach ($staleName in $existingManagedNames) {
  if ($agentNames -notcontains $staleName) {
    $stalePath = Join-Path $agentsRoot $staleName
    if (Test-Path -LiteralPath $stalePath) {
      Remove-Item -LiteralPath $stalePath -Recurse -Force
    }
  }
}

foreach ($agentFile in $agentFiles) {
  $destinationPath = Join-Path $agentsRoot $agentFile.Name

  if (Test-Path -LiteralPath $destinationPath) {
    $canReplace = $false

    if ($existingManagedNames -contains $agentFile.Name) {
      $canReplace = $true
    } elseif (Test-SameFileContent -LeftPath $agentFile.FullName -RightPath $destinationPath) {
      $canReplace = $true
    } elseif (Test-LooksLikeExMachinaAgent -Path $destinationPath) {
      $canReplace = $true
    } elseif ($Force) {
      $canReplace = $true
    }

    if (-not $canReplace) {
      throw "[ExMachina] agent target already exists and does not look managed by ExMachina: $destinationPath`n[ExMachina] remove it manually or rerun with -Force if replacement is intended."
    }

    Remove-Item -LiteralPath $destinationPath -Recurse -Force
  }

  Copy-Item -LiteralPath $agentFile.FullName -Destination $destinationPath -Force
}

Set-Content -LiteralPath $agentManifestPath -Value $agentNames

Assert-InstallState -InstallPath $installPath -AgentsRoot $agentsRoot -AgentManifestPath $agentManifestPath
Show-InstallSummary -InstallPath $installPath -AgentsRoot $agentsRoot -AgentManifestPath $agentManifestPath
Write-Host "[ExMachina] restart Codex so it reloads installed skills and agents."
Write-Host "[ExMachina] for stronger always-on guidance, run: powershell -ExecutionPolicy Bypass -File .\scripts\setup-exmachina.ps1 -InstallGuidance"
