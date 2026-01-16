#!/bin/bash
# Sport-Scoreboard - Quick Deployment Script
# Usage: ./deploy.sh
#
# Deployment User: scoreboard-app (NOT root)
# Host: 10.1.0.51
#
# Remote execution:
#   ssh -i "<path-to-ssh-key>" scoreboard-app@10.1.0.51 "cd /srv/GhostGit/nfl-scoreboard && ./deploy.sh"
#
# Security: This script should be run as the 'scoreboard-app' user,
# which owns /srv/GhostGit/nfl-scoreboard. Never deploy as root.

set -e  # Exit on error

echo "⚽🏈 Sport-Scoreboard Deployment"
echo "=============================="
echo ""

echo "📥 Pulling latest code..."
git pull origin version-3.0

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building production bundle..."
npm run build

echo ""
echo "🔄 Restarting PM2..."
pm2 restart ecosystem.config.cjs

echo ""
echo "✅ Deployment complete!"
echo ""
pm2 list
echo ""
echo "🌐 App running at: http://<YOUR-SERVER-IP>:3001"
