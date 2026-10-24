param([switch]$Offline)
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
    if ($Offline) { $gradleArgs += '--offline' }
    & .\android\gradlew.bat @gradleArgs
    if ($LASTEXITCODE -ne 0) { throw 'Android build or lint failed.' }
    $version = (Get-Content package.json -Raw | ConvertFrom-Json).version
    New-Item dist/android -ItemType Directory -Force | Out-Null
    $destination = "dist/android/LittleGuardian-$version-debug.apk"
    Copy-Item android/app/build/outputs/apk/debug/app-debug.apk $destination -Force
    $hash = (Get-FileHash $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $(Split-Path $destination -Leaf)" | Set-Content "$destination.sha256" -Encoding ascii
    Write-Host "APK: $((Resolve-Path $destination).Path)"
    Write-Host "SHA256: $hash"
} finally { Pop-Location }
