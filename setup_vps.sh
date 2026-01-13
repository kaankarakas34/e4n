#!/bin/bash

# Define paths
ROOT_DIR=$(pwd)

echo "Starting Deployment..."

# --- 1. SOURCE DETECTION & BUILD ---
if [ -f "package.json" ] && [ -d "server" ]; then
    echo "✅ Detected Git Repository structure."
    
    # Check if node_modules exists, avoiding reinstall if possible? 
    # Better to ensure fresh install for production stability or just update
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    
    # Build Frontend
    echo "Building frontend..."
    npm run build
    
    SRC_HTML="$ROOT_DIR/dist"
    SRC_API="$ROOT_DIR/server"
elif [ -d "html" ] && [ -d "api" ]; then
    echo "✅ Detected Artifact Bundle structure."
    SRC_HTML="$ROOT_DIR/html"
    SRC_API="$ROOT_DIR/api"
else
    echo "⚠️  WARNING: Unknown directory structure. Attempting to proceed with default assumptions."
    SRC_HTML="$ROOT_DIR/html"
    SRC_API="$ROOT_DIR/api"
fi

# Update and Install System Dependencies
echo "Updating system packages..."
apt-get update
apt-get install -y curl gnupg2 ca-certificates lsb-release ubuntu-keyring git

# Install Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install Nginx
apt-get install -y nginx

# Install PM2 globally
npm install -g pm2

# Setup Directory Structure at Destination
mkdir -p /var/www/e4n2/html
mkdir -p /var/www/e4n2/api
mkdir -p /var/www/e4n2/email

# Move files
echo "Copying Frontend from $SRC_HTML..."
if [ -d "$SRC_HTML" ]; then
    # Remove old files to ensure clean state
    rm -rf /var/www/e4n2/html/*
    cp -r "$SRC_HTML/"* /var/www/e4n2/html/
else
    echo "❌ ERROR: Source HTML directory $SRC_HTML not found!"
fi

echo "Copying Backend from $SRC_API..."
if [ -d "$SRC_API" ]; then
    # Be careful not to delete node_modules if we want to cache, but safer to clean code
    # We will exclude node_modules from delete if we want speed, but standard replace is better
    # Copying over existing files
    cp -r "$SRC_API/"* /var/www/e4n2/api/
else
    echo "❌ ERROR: Source API directory $SRC_API not found!"
fi

# Copy Configs (Handle both root and bundle locations)
# First try current dir, then try /var/www/e4n2/ cache? No, always from source
cp email-config.json /var/www/e4n2/ 2>/dev/null || echo "Info: email-config.json not found in root"

# Nginx Conf
if [ -f "nginx.conf" ]; then
    cp nginx.conf /var/www/e4n2/
else
    echo "❌ Error: nginx.conf not found!"
fi

# Docker Compose
if [ -f "docker-compose.prod.yml" ]; then
    cp docker-compose.prod.yml /var/www/e4n2/docker-compose.yml
else
    echo "Info: docker-compose.prod.yml not found, checking docker-compose.yml"
    cp docker-compose.yml /var/www/e4n2/ 2>/dev/null
fi

# Init SQL
if [ -f "server/init.sql" ]; then
    cp server/init.sql /var/www/e4n2/
elif [ -f "init.sql" ]; then
    cp init.sql /var/www/e4n2/
fi

# Install Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker root
fi

# Start Database
echo "Starting Database..."
cd /var/www/e4n2
docker compose down || true
docker compose up -d

# Setup Backend
echo "Setting up Backend..."
cd /var/www/e4n2/api
npm install --omit=dev
pm2 delete e4n2-api || true
# Explicitly use port 4000
pm2 start src/index.js --name "e4n2-api" --env "PORT=4000" --env "DB_HOST=localhost" --env "DB_PORT=5433" --env "DB_USER=e4n2" --env "DB_PASSWORD=e4n2pass" --env "DB_NAME=e4n2db"

# Setup Email Service
# In Git Repo mode, server.js is in root.
echo "Setting up Email Service..."
if [ -f "$ROOT_DIR/server.js" ]; then
   cp "$ROOT_DIR/server.js" /var/www/e4n2/email/
   cp "$ROOT_DIR/package.json" /var/www/e4n2/email/ # Use root package.json for deps
fi

cd /var/www/e4n2/email
if [ -f "server.js" ]; then
    npm install
    pm2 delete e4n2-email || true
    pm2 start server.js --name "e4n2-email"
fi

# Save PM2 list
pm2 save
pm2 startup | bash

# Setup Nginx
echo "Configuring Nginx..."
cp /var/www/e4n2/nginx.conf /etc/nginx/sites-available/e4n2
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/e4n2 /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo "✅ Deployment Complete!"
