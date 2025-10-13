#!/bin/bash

# =====================================================================
# deploy_to_ec2.sh - Deploy ML Service to EC2 with Nginx
# =====================================================================

set -e

echo "🚀 Starting ML Service deployment to EC2..."

# EC2 Configuration
EC2_USER="ubuntu"
EC2_HOST="16.176.1.175"
PEM_KEY="/Users/yanuo.zhang/Desktop/5120/ml-service.pem"
DOMAIN="ml.leafforward.space"
SERVICE_PORT="8001"

# Check if PEM key exists
if [ ! -f "$PEM_KEY" ]; then
    echo "❌ Error: PEM key not found at $PEM_KEY"
    exit 1
fi

chmod 400 "$PEM_KEY"

echo "📦 Step 1: Uploading ML Service files to EC2..."

# Create directory on EC2
ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" "mkdir -p ~/ml_service"

# Upload ML service files
echo "→ Uploading Python files..."
scp -i "$PEM_KEY" app.py "$EC2_USER@$EC2_HOST:~/ml_service/"
scp -i "$PEM_KEY" model.py "$EC2_USER@$EC2_HOST:~/ml_service/"
scp -i "$PEM_KEY" data_loader.py "$EC2_USER@$EC2_HOST:~/ml_service/"
scp -i "$PEM_KEY" apply_pledges_impact.py "$EC2_USER@$EC2_HOST:~/ml_service/"
scp -i "$PEM_KEY" requirements.txt "$EC2_USER@$EC2_HOST:~/ml_service/"

# Upload model directory
echo "→ Uploading model files..."
scp -i "$PEM_KEY" -r model "$EC2_USER@$EC2_HOST:~/ml_service/"

echo "✅ Files uploaded"
echo ""
echo "🔧 Step 2: Setting up Python environment and dependencies..."

ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
cd ~/ml_service

# Install Python3 and pip if not already installed
if ! command -v python3 &> /dev/null; then
    echo "Installing Python3..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate and install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Python environment ready"
ENDSSH

echo ""
echo "🔧 Step 3: Setting up systemd service..."

# Create systemd service file
cat > /tmp/ml-service.service << EOF
[Unit]
Description=EcoPath ML Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/ml_service
Environment="PATH=/home/ubuntu/ml_service/venv/bin"
Environment="DB_HOST=ecopath-db.cho4smk8uhuh.ap-southeast-2.rds.amazonaws.com"
Environment="DB_PORT=5432"
Environment="DB_NAME=ecopath-db"
Environment="DB_USER=postgres"
Environment="DB_PASSWORD=EcoDb2025!"
ExecStart=/home/ubuntu/ml_service/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Upload and install service
scp -i "$PEM_KEY" /tmp/ml-service.service "$EC2_USER@$EC2_HOST:~/ml-service.service"
rm /tmp/ml-service.service

ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
# Move service file and enable
sudo mv ~/ml-service.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ml-service
sudo systemctl restart ml-service

# Check service status
sleep 3
sudo systemctl status ml-service --no-pager || true
ENDSSH

echo "✅ Systemd service configured"
echo ""
echo "🔧 Step 4: Configuring Nginx..."

# Create Nginx configuration
cat > /tmp/ml-service-nginx << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL certificates (to be configured with Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/ml-service-access.log;
    error_log /var/log/nginx/ml-service-error.log;

    # Proxy settings
    location / {
        proxy_pass http://localhost:$SERVICE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$SERVICE_PORT/health;
        access_log off;
    }
}
EOF

# Upload Nginx config
scp -i "$PEM_KEY" /tmp/ml-service-nginx "$EC2_USER@$EC2_HOST:~/ml-service-nginx"
rm /tmp/ml-service-nginx

ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" << ENDSSH
# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Move Nginx config
sudo mv ~/ml-service-nginx /etc/nginx/sites-available/ml-service

# Create symlink (remove if exists)
sudo rm -f /etc/nginx/sites-enabled/ml-service
sudo ln -s /etc/nginx/sites-available/ml-service /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

echo "✅ Nginx configured"
ENDSSH

echo ""
echo "🔧 Step 5: Setting up SSL with Let's Encrypt..."
echo ""
echo "⚠️  IMPORTANT: Before running certbot, make sure:"
echo "   1. DNS record for $DOMAIN points to $EC2_HOST"
echo "   2. Port 80 and 443 are open in EC2 security group"
echo ""
read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."

ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" << ENDSSH
# Obtain SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email your-email@example.com || {
    echo "⚠️  SSL certificate setup failed. You may need to:"
    echo "   1. Verify DNS is pointing to this server"
    echo "   2. Run: sudo certbot --nginx -d $DOMAIN"
    exit 0
}

# Reload Nginx
sudo systemctl reload nginx

echo "✅ SSL configured"
ENDSSH

echo ""
echo "🔍 Step 6: Verifying deployment..."

ssh -i "$PEM_KEY" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
echo "→ ML Service status:"
sudo systemctl status ml-service --no-pager | head -10

echo ""
echo "→ Nginx status:"
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "→ Testing local endpoint:"
curl -s http://localhost:8001/ || echo "Service not responding"

echo ""
echo "→ Open ports:"
sudo netstat -tlnp | grep -E ':(80|443|8001)' || true
ENDSSH

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Summary:"
echo "  - ML Service: http://localhost:$SERVICE_PORT"
echo "  - Domain: https://$DOMAIN"
echo "  - Service: systemctl status ml-service"
echo "  - Logs: journalctl -u ml-service -f"
echo ""
echo "🔗 Next steps:"
echo "  1. Verify DNS: dig $DOMAIN"
echo "  2. Test endpoint: curl https://$DOMAIN/"
echo "  3. Check SSL: curl -I https://$DOMAIN/"

