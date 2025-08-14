#requires -Version 7
<#
  Usage examples:
    .\tools\cosmos-query.ps1 -Sql 'SELECT TOP 5 * FROM c'
    .\tools\cosmos-query.ps1 -Sql 'SELECT * FROM c WHERE c.setId=@id' -Params 'id=557'
    .\tools\cosmos-query.ps1 -Sql 'SELECT * FROM c WHERE STARTSWITH(c.id,@p)' -Params 'p=pokedata-'
    .\tools\cosmos-query.ps1 -Sql 'SELECT TOP 3 * FROM c' -Container 'Sets' -DryRun
#>

param(
  [Parameter(Mandatory)]
  [string]$Sql,

  [string]$Params = "",

  [string]$Container,

  [string]$EnvPath = (Join-Path (Split-Path -Parent $PSScriptRoot) ".env"),

  [switch]$DryRun
)

function Load-DotEnv([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return }
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        if ($line -match '^\s*([^=\s]+)\s*=\s*(.*)\s*$') {
            $key = $matches[1]
            $val = $matches[2]
            if ($val -match '^"(.*)"$') { $val = $matches[1] }
            elseif ($val -match "^'(.*)'$") { $val = $matches[1] }
            [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
        }
    }
}

function Parse-Params([string]$Pairs) {
    if (-not $Pairs) { return @() }
    $items = @()
    foreach ($pair in ($Pairs -split '\s*,\s*')) {
        if (-not $pair) { continue }
        $kv = $pair -split '=', 2
        if ($kv.Count -ne 2) { continue }
        $name  = $kv[0]
        $value = $kv[1]
        if ($value -match '^(true|false)$') { $valObj = [bool]::Parse($value) }
        elseif ($value -match '^-?\d+$')   { $valObj = [int64]$value }
        elseif ($value -match '^-?\d+\.\d+$') { $valObj = [double]$value }
        else { $valObj = $value }
        $items += @{ name = "@$name"; value = $valObj }
    }
    return $items
}

# Load env from .env
Load-DotEnv -Path $EnvPath

# Resolve account/db/container
$account   = $env:COSMOS_ACCOUNT
$database  = $env:COSMOS_DB
$container = if ($Container) { $Container }
             elseif ($env:COSMOS_CARDS_CONTAINER) { $env:COSMOS_CARDS_CONTAINER }
             elseif ($env:COSMOS_CONTAINER) { $env:COSMOS_CONTAINER }
             else { $env:COSMOS_SETS_CONTAINER }

if (-not $account -or -not $database -or -not $container) {
    Write-Error "Missing required environment variables. Account: '$account', DB: '$database', Container: '$container'"
    exit 1
}

# Build parameters JSON (if any)
$paramObjs = Parse-Params -Pairs $Params
$paramsJson = if ($paramObjs.Count -gt 0) { $paramObjs | ConvertTo-Json -Compress } else { "" }

# Build az args
$azArgs = @(
  'cosmosdb','sql','query',
  '--account-name', $account,
  '--database-name', $database,
  '--container-name', $container,
  '--query', $Sql,
  '--output','json'
)
if ($paramsJson) { $azArgs += @('--parameters', $paramsJson) }

# Dry run mode
if ($DryRun) {
    $plan = @{
        ok = $true
        op = 'cosmos.query'
        account = $account
        database = $database
        container = $container
        sql = $Sql
        parameters = $paramObjs
    }
    $plan | ConvertTo-Json -Compress | Write-Output
    exit 0
}

# Execute query
$azOutput = & az @azArgs 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Azure CLI error: $azOutput"
    exit $LASTEXITCODE
}

# Emit raw JSON
Write-Output $azOutput
