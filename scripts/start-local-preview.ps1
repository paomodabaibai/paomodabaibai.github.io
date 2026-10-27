$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = 'E:\CodexData\Temp\peanutmilk-preview'
$url = 'http://127.0.0.1:5173/'
$mutex = New-Object System.Threading.Mutex($false, 'Local\PeanutMilkPreview5173')
$ownsMutex = $false
$exitCode = 0

function Write-PreviewLog([string]$message) {
    Add-Content -LiteralPath (Join-Path $runtimeDirectory 'startup.log') -Encoding UTF8 `
        -Value ('{0:yyyy-MM-dd HH:mm:ss} {1}' -f (Get-Date), $message)
}

function Test-PreviewResponse {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
        return ($response.StatusCode -eq 200 -and $response.Content -ceq $script:expectedHtml)
    } catch {
        return $false
    }
}

function Test-PreviewPort {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $client.Connect('127.0.0.1', 5173)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

try {
    try { $ownsMutex = $mutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { exit 0 }

    New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
    $env:TEMP = $runtimeDirectory
    $env:TMP = $runtimeDirectory
    $env:PORT = '5173'
    $script:expectedHtml = [IO.File]::ReadAllText((Join-Path $projectRoot 'index.html'))

    if (Test-PreviewResponse) {
        Write-PreviewLog "Already running: $url"
        exit 0
    }
    if (Test-PreviewPort) {
        throw 'Port 5173 is occupied by a different service. No process was stopped.'
    }

    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $serverPath = Join-Path $PSScriptRoot 'serve.mjs'
    $server = Start-Process -FilePath $nodePath -ArgumentList ('"{0}"' -f $serverPath) `
        -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $runtimeDirectory 'server.stdout.log') `
        -RedirectStandardError (Join-Path $runtimeDirectory 'server.stderr.log')

    $ready = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if (Test-PreviewResponse) { $ready = $true; break }
        if ($server.HasExited) { break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $ready) {
        throw 'Preview did not become ready. Check server.stderr.log.'
    }
    Write-PreviewLog "Started PID $($server.Id): $url"
} catch {
    $exitCode = 1
    if (Test-Path -LiteralPath $runtimeDirectory) {
        Write-PreviewLog "ERROR: $($_.Exception.Message)"
    }
    Write-Error -Message $_.Exception.Message -ErrorAction Continue
} finally {
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}

exit $exitCode
