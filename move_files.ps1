$workspace = "T:\Cadet's Compass"
Set-Location $workspace

# Move server contents to backend
if (Test-Path "server") {
    Get-ChildItem -Path "server" -Force | Move-Item -Destination "backend" -Force
    Remove-Item "server" -Force -ErrorAction SilentlyContinue
}

# Move frontend folders
if (Test-Path "views") {
    Move-Item -Path "views" -Destination "frontend" -Force
}
if (Test-Path "public") {
    Move-Item -Path "public" -Destination "frontend" -Force
}
if (Test-Path "config") {
    Move-Item -Path "config" -Destination "frontend" -Force
}
if (Test-Path "package.json") {
    Move-Item -Path "package.json" -Destination "frontend" -Force
}
if (Test-Path "package-lock.json") {
    Move-Item -Path "package-lock.json" -Destination "frontend" -Force
}

Write-Host "Files moved successfully!"
