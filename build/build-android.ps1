param(
    [switch]$Offline,
    [string]$UpdateManifestUrl = 'http://192.168.0.33:8765/dist/android/update.json',
    [string]$ApkBaseUrl = 'http://192.168.0.33:8765/dist/android/',
    [string]$Notes = ''
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $projectRoot
try {
    if (-not $env:JAVA_HOME) { $env:JAVA_HOME = Join-Path $env:LOCALAPPDATA 'Android\jdk\17' }
    if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
    if (-not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) { throw 'Set JAVA_HOME to a JDK 17 installation.' }
    if (-not (Test-Path $env:ANDROID_HOME)) { throw 'Set ANDROID_HOME to an Android SDK installation.' }
    node build/build.js
    if ($LASTEXITCODE -ne 0) { throw 'Game build failed.' }
    $gradleArgs = @('-p', 'android', '--no-daemon', ':app:assembleDebug', ':app:lintDebug')
    $gradleArgs += "-PupdateManifestUrl=$UpdateManifestUrl"
    if ($Offline) { $gradleArgs += '--offline' }
    & .\android\gradlew.bat @gradleArgs
    if ($LASTEXITCODE -ne 0) { throw 'Android build or lint failed.' }
    $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
    $buildNumber = [int]((Get-Content android/version.properties | Where-Object { $_ -match '^buildNumber=' }) -replace '^buildNumber=', '')
    $parts = $version.Split('.')
    $versionCode = [int]$parts[0] * 1000000 + [int]$parts[1] * 10000 + [int]$parts[2] * 100 + $buildNumber
    $versionName = "$version-test.$buildNumber"
    if (-not $Notes) { $Notes = (Get-Content android/update-notes.txt -Encoding UTF8 -Raw).Trim() }
    New-Item dist/android -ItemType Directory -Force | Out-Null
    $destination = "dist/android/LittleGuardian-$versionName.apk"
    Copy-Item android/app/build/outputs/apk/debug/app-debug.apk $destination -Force
    $hash = (Get-FileHash $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $(Split-Path $destination -Leaf)" | Set-Content "$destination.sha256" -Encoding ascii
    $manifest = [ordered]@{
        versionCode = $versionCode
        versionName = $versionName
        apkUrl = $ApkBaseUrl.TrimEnd('/') + '/' + (Split-Path $destination -Leaf)
        sha256 = $hash
        sizeBytes = (Get-Item $destination).Length
        notes = $Notes
    } | ConvertTo-Json
    [IO.File]::WriteAllText((Join-Path $projectRoot 'dist/android/update.json'), $manifest, [Text.UTF8Encoding]::new($false))
    Write-Host "APK: $((Resolve-Path $destination).Path)"
    Write-Host "SHA256: $hash"
} finally { Pop-Location }
