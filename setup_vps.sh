#!/bin/bash

# Update and Install Dependencies
apt-get update
apt-get install -y curl gnupg2 ca-certificates lsb-release ubuntu-keyring

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Nginx
apt-get install -y nginx

# Install PM2 globally
npm install -g pm2

# Setup Directory Structure
mkdir -p /var/www/e4n2/html
mkdir -p /var/www/e4n2/api
mkdir -p /var/www/e4n2/email

# Move files (Assumes this script is run from the uploaded deploy folder)
# We expect the structure:
# ./html -> /var/www/e4n2/html
# ./api -> /var/www/e4n2/api
# ./email -> /var/www/e4n2/email
# ./nginx.conf -> /etc/nginx/sites-available/e4n2

cp -r ./html/* /var/www/e4n2/html/
cp -r ./api/* /var/www/e4n2/api/
cp -r ./email/* /var/www/e4n2/email/

cp email-config.json /var/www/e4n2/

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
usermod -aG docker root

# Move Docker files
cp docker-compose.prod.yml /var/www/e4n2/docker-compose.yml
cp init.sql /var/www/e4n2/

# Start Database
cd /var/www/e4n2
docker compose down || true
docker compose up -d

# Setup Backend
cd /var/www/e4n2/api
npm install
pm2 delete e4n2-api || true
# Connect to Docker DB on localhost:5433
pm2 start src/index.js --name "e4n2-api" --env "PORT=4000" --env "DB_HOST=localhost" --env "DB_PORT=5433" --env "DB_USER=e4n2" --env "DB_PASSWORD=e4n2pass" --env "DB_NAME=e4n2db"

# Setup Email Service
cd /var/www/e4n2/email
npm install
pm2 delete e4n2-email || true
pm2 start server.js --name "e4n2-email"

# Save PM2 list
pm2 save
pm2 startup | bash

# Setup Nginx
cp /var/www/e4n2/nginx.conf /etc/nginx/sites-available/e4n2
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/e4n2 /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo "Deployment Complete! Visit http://$(curl -s ifconfig.me)"
