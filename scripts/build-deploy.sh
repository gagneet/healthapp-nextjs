#!/bin/bash

# build-deploy.sh - Simple Build and Deploy Script for Healthcare Management Platform
# Usage: ./scripts/build-deploy.sh [--skip-build] [--skip-restart]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Options
SKIP_BUILD=false
SKIP_RESTART=false

# Parse command line arguments
for arg in "$@"
do
    case $arg in
        --skip-build)
        SKIP_BUILD=true
        shift
        ;;
        --skip-restart)
        SKIP_RESTART=true
        shift
        ;;
        --help)
        echo "Usage: ./scripts/build-deploy.sh [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --skip-build     Skip the build step (use existing build)"
        echo "  --skip-restart   Don't restart the application"
        echo "  --help           Show this help message"
        exit 0
        ;;
    esac
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Healthcare Management Platform - Build & Deploy Script    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Change to application directory
cd "$APP_DIR"
echo -e "${CYAN}📂 Working directory: ${GREEN}$(pwd)${NC}"
echo ""

# Step 1: Check environment file
echo -e "${BLUE}═══ Step 1: Environment Configuration ═══${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file before deploying${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Step 2: Stop ALL running Next.js processes on port 3002
echo -e "${BLUE}═══ Step 2: Stop Running Application ═══${NC}"
echo -e "${CYAN}Checking for running processes on port 3002...${NC}"

# Function to kill all next-server processes on port 3002
kill_all_nextjs_3002() {
    # Kill all next-server processes (including root processes)
    local PIDS=$(ps aux | grep -E "next-server.*3002|next start.*3002" | grep -v grep | awk '{print $2}')
    if [ ! -z "$PIDS" ]; then
        echo -e "${YELLOW}⚠️  Found Next.js processes: $PIDS${NC}"
        echo "$PIDS" | while read pid; do
            USER=$(ps -p $pid -o user= 2>/dev/null)
            if [ "$USER" = "root" ]; then
                echo -e "${CYAN}Killing root process $pid with sudo...${NC}"
                sudo kill -9 $pid 2>/dev/null || true
            else
                echo -e "${CYAN}Killing process $pid...${NC}"
                kill -9 $pid 2>/dev/null || true
            fi
        done
        sleep 2
        echo -e "${GREEN}✅ All Next.js processes stopped${NC}"
    else
        echo -e "${YELLOW}ℹ️  No Next.js processes found on port 3002${NC}"
    fi
}

# Kill all next-server processes
kill_all_nextjs_3002

# Kill any remaining sh processes that might be parent processes
SHELL_PIDS=$(ps aux | grep "sh -c next start" | grep -v grep | awk '{print $2}')
if [ ! -z "$SHELL_PIDS" ]; then
    echo -e "${CYAN}Cleaning up shell processes...${NC}"
    echo "$SHELL_PIDS" | while read pid; do
        sudo kill -9 $pid 2>/dev/null || kill -9 $pid 2>/dev/null || true
    done
fi

# Stop PM2 process if exists
if pm2 list 2>/dev/null | grep -q "healthapp-nextjs"; then
    echo -e "${CYAN}Stopping PM2 process...${NC}"
    pm2 delete healthapp-nextjs 2>/dev/null || true
    echo -e "${GREEN}✅ PM2 process stopped${NC}"
fi

# Verify port 3002 is free
echo -e "${CYAN}Verifying port 3002 is free...${NC}"
sleep 2
if netstat -tlnp 2>/dev/null | grep -q ":3002"; then
    echo -e "${RED}⚠️  Port 3002 still in use, attempting final cleanup...${NC}"
    PORT_PID=$(sudo netstat -tlnp 2>/dev/null | grep ":3002" | awk '{print $7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "$PORT_PID" ]; then
        sudo kill -9 $PORT_PID 2>/dev/null || true
        sleep 1
    fi
fi

if netstat -tlnp 2>/dev/null | grep -q ":3002"; then
    echo -e "${RED}❌ ERROR: Port 3002 is still in use!${NC}"
    echo -e "${YELLOW}Please manually run: sudo netstat -tlnp | grep 3002${NC}"
    echo -e "${YELLOW}Then kill the process: sudo kill -9 <PID>${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Port 3002 is free${NC}"
fi
echo ""

# Step 3: Clean previous build (if needed)
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${BLUE}═══ Step 3: Clean Previous Build ═══${NC}"
    echo -e "${CYAN}Removing .next directory...${NC}"

    # Fix ownership if .next is owned by root
    if [ -d ".next" ]; then
        NEXT_OWNER=$(ls -ld .next | awk '{print $3}')
        if [ "$NEXT_OWNER" = "root" ]; then
            echo -e "${YELLOW}⚠️  .next directory owned by root, fixing permissions...${NC}"
            sudo chown -R gagneet:gagneet .next
        fi
        rm -rf .next
        echo -e "${GREEN}✅ .next directory removed${NC}"
    else
        echo -e "${YELLOW}ℹ️  No .next directory found (fresh build)${NC}"
    fi
    echo ""
fi

# Step 4: Install dependencies
echo -e "${BLUE}═══ Step 4: Install Dependencies ═══${NC}"
echo -e "${CYAN}Running npm install...${NC}"
npm install --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 5: Build application
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${BLUE}═══ Step 5: Build Application ═══${NC}"
    echo -e "${CYAN}Running npm run build...${NC}"
    npm run build
    echo -e "${GREEN}✅ Build completed successfully${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping build step (--skip-build flag)${NC}"
    echo ""
fi

# Step 6: Create logs directory
echo -e "${BLUE}═══ Step 6: Prepare Logs Directory ═══${NC}"
mkdir -p logs
echo -e "${GREEN}✅ Logs directory ready${NC}"
echo ""

# Step 7: Start application with PM2
if [ "$SKIP_RESTART" = false ]; then
    echo -e "${BLUE}═══ Step 7: Start Application with PM2 ═══${NC}"

    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}❌ PM2 not found!${NC}"
        echo -e "${YELLOW}Installing PM2 globally...${NC}"
        sudo npm install -g pm2
    fi

    # Start or restart with PM2
    if pm2 list | grep -q "healthapp-nextjs"; then
        echo -e "${CYAN}Restarting existing PM2 process...${NC}"
        pm2 restart healthapp-nextjs --update-env
    else
        echo -e "${CYAN}Starting new PM2 process...${NC}"
        pm2 start ecosystem.config.cjs
    fi

    echo -e "${GREEN}✅ Application started with PM2${NC}"
    echo ""

    # Save PM2 configuration
    echo -e "${CYAN}Saving PM2 configuration...${NC}"
    pm2 save
    echo -e "${GREEN}✅ PM2 configuration saved${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping restart (--skip-restart flag)${NC}"
    echo ""
fi

# Step 8: Display status
echo -e "${BLUE}═══ Step 8: Deployment Status ═══${NC}"
echo ""
pm2 list
echo ""

# Step 9: Show logs command
echo -e "${BLUE}═══ Useful Commands ═══${NC}"
echo -e "${CYAN}View logs:${NC}       pm2 logs healthapp-nextjs"
echo -e "${CYAN}Stop app:${NC}        pm2 stop healthapp-nextjs"
echo -e "${CYAN}Restart app:${NC}     pm2 restart healthapp-nextjs"
echo -e "${CYAN}Monitor app:${NC}     pm2 monit"
echo -e "${CYAN}App status:${NC}      pm2 status healthapp-nextjs"
echo ""

# Step 10: Check if application is accessible
echo -e "${BLUE}═══ Step 10: Application Accessibility Check ═══${NC}"
sleep 3  # Wait for app to start

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200\|302\|301"; then
    echo -e "${GREEN}✅ Application is accessible on http://localhost:3002${NC}"
    echo -e "${GREEN}✅ External URL: https://healthapp.gagneet.com${NC}"
else
    echo -e "${YELLOW}⚠️  Application may still be starting up...${NC}"
    echo -e "${CYAN}Check logs: pm2 logs healthapp-nextjs${NC}"
fi
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║             🎉 Deployment Completed Successfully! 🎉         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Access your application at:${NC} ${GREEN}https://healthapp.gagneet.com${NC}"
echo ""
