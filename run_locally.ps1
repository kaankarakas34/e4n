Write-Host "Starting E4N2 Project..."

# Start Backend API (Port 4000)
Write-Host "Launching Backend API..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# Start Email Server (Port 3001)
Write-Host "Launching Email Server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js"

# Start Frontend (Vite)
Write-Host "Launching Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "All services should be running in new windows."
