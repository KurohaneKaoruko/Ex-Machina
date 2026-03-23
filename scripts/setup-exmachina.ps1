[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$CodexHome = (Join-Path $HOME ".codex"),
  [switch]$Force
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
    if (Test-Path -LiteralPath (Join-Path $resolved "exmachina\\skills")) {
      return $resolved
    }
  }

  throw "[ExMachina] cannot locate repository root from $StartDirectory"
}

$scriptDirectory = Split-Path -Parent $PSCommandPath
if (-not $RepoRoot) {
  $RepoRoot = Resolve-RepoRoot -StartDirectory $scriptDirectory
}

$skillsSource = Join-Path $RepoRoot "exmachina\\skills"
if (-not (Test-Path -LiteralPath $skillsSource)) {
  throw "[ExMachina] skills directory not found: $skillsSource`n[ExMachina] run npm run generate if you are working from source."
}

$skillsRoot = Join-Path $CodexHome "skills"
$installPath = Join-Path $skillsRoot "exmachina"

New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null

if (Test-Path -LiteralPath $installPath) {
  $item = Get-Item -LiteralPath $installPath -Force
  $isReparsePoint = (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)

  if (-not $isReparsePoint -and -not $Force) {
    throw "[ExMachina] target already exists and is not a link: $installPath`n[ExMachina] remove it manually or rerun with -Force if replacement is intended."
  }

  Remove-Item -LiteralPath $installPath -Recurse -Force
}

New-Item -ItemType Junction -Path $installPath -Target $skillsSource | Out-Null

$verificationPath = Join-Path $installPath "using-exmachina\SKILL.md"
if (-not (Test-Path -LiteralPath $verificationPath)) {
  throw "[ExMachina] install verification failed: using-exmachina skill missing after link."
}

Write-Host "[ExMachina] installed to $installPath"
Write-Host "[ExMachina] restart Codex so it reloads installed skills."
