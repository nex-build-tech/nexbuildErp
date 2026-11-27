# ==============================================================================
# BuildERP - Windows PowerShell Daily MySQL Backup Script
# ==============================================================================
param(
  [string]$DbHost = "localhost",
  [int]$DbPort = 3307,
  [string]$DbUser = "root",
  [string]$DbPass = "",
  [string]$DbName = "builderp",
  [string]$BackupDir = "D:\demo\goodsmanagement\backups",
  [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sqlFile = Join-Path $BackupDir "${DbName}_backup_${timestamp}.sql"
$logFile = Join-Path $BackupDir "backup.log"

function Log-Message ($msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

Log-Message "▶ Starting MySQL backup for database '${DbName}' on port $DbPort..."
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

# Find mysqldump executable
$mysqlDumpPath = "mysqldump"
if (Test-Path "C:\xampp\mysql\bin\mysqldump.exe") {
  $mysqlDumpPath = "C:\xampp\mysql\bin\mysqldump.exe"
}

$dumpArgs = @(
  "--host=$DbHost",
  "--port=$DbPort",
  "--user=$DbUser",
  "--single-transaction",
  "--quick",
  "--routines",
  "--triggers",
  "--default-character-set=utf8mb4",
  $DbName,
  "--result-file=$sqlFile"
)

if ($DbPass) {
  $dumpArgs = @("--password=$DbPass") + $dumpArgs
}

& $mysqlDumpPath @dumpArgs

$stopwatch.Stop()
$fileSize = (Get-Item $sqlFile).Length / 1KB

Log-Message ("✅ Backup created successfully in {0}s: {1} (Size: {2:N2} KB)" -f $stopwatch.Elapsed.TotalSeconds, $sqlFile, $fileSize)

# Clean up older backups
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "${DbName}_backup_*.sql" | Where-Object { $_.LastWriteTime -lt $cutoffDate } | ForEach-Object {
  Log-Message "Removing old backup: $($_.Name)"
  Remove-Item $_.FullName -Force
}

Log-Message "🎉 Backup complete."
