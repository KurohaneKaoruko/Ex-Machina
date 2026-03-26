[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$CodexHome = (Join-Path $HOME ".codex"),
  [switch]$Force,
  [switch]$Verify,
  [switch]$Uninstall
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

if ($Verify -and $Uninstall) {
  throw "[ExMachina] choose only one mode: -Verify or -Uninstall"
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
