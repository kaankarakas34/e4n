$deployDir = "c:\Users\murat\OneDrive\Desktop\e4n2\deploy"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Force -Path "$deployDir\html"
New-Item -ItemType Directory -Force -Path "$deployDir\api"
New-Item -ItemType Directory -Force -Path "$deployDir\email"

Write-Host "Copying Frontend..."
Copy-Item -Recurse -Force "c:\Users\murat\OneDrive\Desktop\e4n2\dist\*" "$deployDir\html\"

Write-Host "Copying Backend..."
Copy-Item -Recurse -Force "c:\Users\murat\OneDrive\Desktop\e4n2\server\*" "$deployDir\api\"
# Remove node_modules if copied
if (Test-Path "$deployDir\api\node_modules") { Remove-Item -Recurse -Force "$deployDir\api\node_modules" }

Write-Host "Copying Email Service..."
Copy-Item -Force "c:\Users\murat\OneDrive\Desktop\e4n2\server.js" "$deployDir\email\"
Copy-Item -Force "c:\Users\murat\OneDrive\Desktop\e4n2\package.json" "$deployDir\email\"
# Remove scripts from root package.json for email service? Not needed, just clean install.

Write-Host "Copying Configs..."
Copy-Item -Force "c:\Users\murat\OneDrive\Desktop\e4n2\email-config.json" "$deployDir\"
Copy-Item -Force "c:\Users\murat\OneDrive\Desktop\e4n2\nginx.conf" "$deployDir\"
Copy-Item -Force "c:\Users\murat\OneDrive\Desktop\e4n2\setup_vps.sh" "$deployDir\"
Copy-Item -Force "c:\Users\murat\OneDrive\Desktop\e4n2\docker-compose.prod.yml" "$deployDir\"
Copy-Item -Force "c:\Users\murat\OneDrive\Desktop\e4n2\server\init.sql" "$deployDir\"

Write-Host "Deploy Bundle Ready!"
