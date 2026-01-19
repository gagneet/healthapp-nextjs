#!/bin/bash

# quick-restart.sh - Quick restart script for healthcare app
# Usage: ./scripts/quick-restart.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Healthcare App - Quick Restart      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

cd "$(dirname "$0")/.."

# Step 1: Kill all Next.js processes on port 3002
echo -e "${CYAN}1. Stopping all processes on port 3002...${NC}"

# Kill next-server processes
PIDS=$(ps aux | grep -E "next-server.*3002|next start.*3002" | grep -v grep | awk '{print $2}')
if [ ! -z "$PIDS" ]; then
    echo "$PIDS" | while read pid; do
        USER=$(ps -p $pid -o user= 2>/dev/null)
        if [ "$USER" = "root" ]; then
            sudo kill -9 $pid 2>/dev/null || true
        else
            kill -9 $pid 2>/dev/null || true
        fi
    done
fi

# Kill shell parent processes
SHELL_PIDS=$(ps aux | grep "sh -c next start" | grep -v grep | awk '{print $2}')
if [ ! -z "$SHELL_PIDS" ]; then
    echo "$SHELL_PIDS" | while read pid; do
        sudo kill -9 $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
    done
fi

sleep 2

# Step 2: Delete PM2 process if exists
if pm2 list 2>/dev/null | grep -q "healthapp-nextjs"; then
    echo -e "${CYAN}2. Deleting PM2 process...${NC}"
    pm2 delete healthapp-nextjs 2>/dev/null || true
fi

# Step 3: Verify port is free
echo -e "${CYAN}3. Verifying port 3002 is free...${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":3002"; then
    PORT_PID=$(sudo netstat -tlnp 2>/dev/null | grep ":3002" | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "$PORT_PID" ]; then
        echo -e "${YELLOW}   Killing remaining process on port 3002...${NC}"
        sudo kill -9 $PORT_PID 2>/dev/null || true
        sleep 1
    fi
fi

if netstat -tlnp 2>/dev/null | grep -q ":3002"; then
    echo -e "${RED}❌ ERROR: Port 3002 is still in use!${NC}"
    sudo netstat -tlnp | grep 3002
    exit 1
fi

echo -e "${GREEN}✅ Port 3002 is free${NC}"

# Step 4: Start with PM2
echo -e "${CYAN}4. Starting application with PM2...${NC}"
pm2 start ecosystem.config.cjs

# Step 5: Wait and check status
echo -e "${CYAN}5. Waiting for application to start...${NC}"
sleep 3

pm2 status

# Step 6: Verify it's running
echo -e "${CYAN}6. Verifying application is accessible...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200\|302"; then
    echo -e "${GREEN}✅ Application is running and accessible!${NC}"
else
    echo -e "${YELLOW}⚠️  Application may still be starting...${NC}"
    echo -e "${CYAN}   Check logs: pm2 logs healthapp-nextjs${NC}"
fi

# Step 7: Save PM2 config
echo -e "${CYAN}7. Saving PM2 configuration...${NC}"
pm2 save

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      🎉 Restart Complete! 🎉           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Access: ${GREEN}https://healthapp.gagneet.com${NC}"
echo -e "${CYAN}Logs:   ${YELLOW}pm2 logs healthapp-nextjs${NC}"
echo -e "${CYAN}Status: ${YELLOW}pm2 status${NC}"
echo ""
