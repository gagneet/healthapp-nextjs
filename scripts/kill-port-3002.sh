#!/bin/bash

# kill-port-3002.sh - Forcefully kill everything on port 3002
# Usage: ./scripts/kill-port-3002.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔍 Finding processes on port 3002...${NC}"

# Method 1: Kill by process name pattern
echo -e "${CYAN}Killing all next-server processes...${NC}"
PIDS=$(ps aux | grep -E "next-server.*3002|next start.*3002" | grep -v grep | awk '{print $2}')
if [ ! -z "$PIDS" ]; then
    echo -e "${YELLOW}Found PIDs: $PIDS${NC}"
    echo "$PIDS" | while read pid; do
        USER=$(ps -p $pid -o user= 2>/dev/null)
        echo -e "${CYAN}  Killing PID $pid (user: $USER)...${NC}"
        if [ "$USER" = "root" ]; then
            sudo kill -9 $pid 2>/dev/null || true
        else
            kill -9 $pid 2>/dev/null || true
        fi
    done
else
    echo -e "${YELLOW}No next-server processes found by name${NC}"
fi

# Method 2: Kill shell parent processes
echo -e "${CYAN}Killing parent shell processes...${NC}"
SHELL_PIDS=$(ps aux | grep "sh -c next start" | grep -v grep | awk '{print $2}')
if [ ! -z "$SHELL_PIDS" ]; then
    echo -e "${YELLOW}Found shell PIDs: $SHELL_PIDS${NC}"
    echo "$SHELL_PIDS" | while read pid; do
        sudo kill -9 $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
    done
else
    echo -e "${YELLOW}No shell processes found${NC}"
fi

# Method 3: Kill by port (most reliable)
echo -e "${CYAN}Checking port 3002 directly...${NC}"
if sudo netstat -tlnp 2>/dev/null | grep -q ":3002"; then
    PORT_PID=$(sudo netstat -tlnp 2>/dev/null | grep ":3002" | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "$PORT_PID" ] && [ "$PORT_PID" != "-" ]; then
        echo -e "${YELLOW}Found process $PORT_PID on port 3002${NC}"
        echo -e "${CYAN}  Killing PID $PORT_PID with sudo...${NC}"
        sudo kill -9 $PORT_PID 2>/dev/null || true
    fi
fi

# Wait and verify
sleep 2

echo ""
echo -e "${CYAN}🔍 Verification:${NC}"
if sudo netstat -tlnp 2>/dev/null | grep -q ":3002"; then
    echo -e "${RED}❌ Port 3002 is STILL in use:${NC}"
    sudo netstat -tlnp | grep 3002
    echo ""
    echo -e "${YELLOW}Manual action required:${NC}"
    echo -e "  1. sudo netstat -tlnp | grep 3002"
    echo -e "  2. sudo kill -9 <PID>"
    exit 1
else
    echo -e "${GREEN}✅ Port 3002 is now FREE${NC}"
    echo ""
    echo -e "${CYAN}You can now start the app:${NC}"
    echo -e "  ${GREEN}pm2 start ecosystem.config.cjs${NC}"
    echo -e "  ${GREEN}./scripts/quick-restart.sh${NC}"
fi
