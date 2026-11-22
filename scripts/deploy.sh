#!/bin/bash

# Deploy script for New Year Countdown
# Builds the Next.js application for static export to Apache

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  New Year Countdown - Deploy Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_DIR/.env" ]; then
    # Source the .env file, but only export variables we care about
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Clean previous builds
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
if [ -d ".next" ]; then
    rm -rf .next
    echo "  ✓ Removed .next directory"
fi
if [ -d "out" ]; then
    rm -rf out
    echo "  ✓ Removed out directory"
fi
echo ""

# Run linting (optional, but good practice)
echo -e "${BLUE}🔍 Running linter...${NC}"
if npm run lint --silent 2>/dev/null; then
    echo -e "  ${GREEN}✓ Linting passed${NC}"
else
    echo -e "  ${YELLOW}⚠️  Linting issues found (continuing anyway)${NC}"
fi
echo ""

# Build the application
echo -e "${BLUE}🔨 Building application for static export...${NC}"
if npm run build; then
    echo -e "  ${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "  ${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Verify build output
echo -e "${BLUE}✅ Verifying build output...${NC}"
if [ ! -d "out" ]; then
    echo -e "  ${RED}✗ Error: out directory not found${NC}"
    exit 1
fi

if [ ! -f "out/index.html" ]; then
    echo -e "  ${RED}✗ Error: out/index.html not found${NC}"
    exit 1
fi

if [ ! -f "out/.htaccess" ]; then
    echo -e "  ${YELLOW}⚠️  Warning: out/.htaccess not found${NC}"
    echo "  Copying .htaccess manually..."
    cp .htaccess out/.htaccess 2>/dev/null || echo -e "  ${RED}✗ Failed to copy .htaccess${NC}"
fi

# Count files in out directory
FILE_COUNT=$(find out -type f | wc -l | tr -d ' ')
echo -e "  ${GREEN}✓ Build output verified${NC}"
echo -e "  ${GREEN}✓ Found $FILE_COUNT files in out directory${NC}"
echo ""

# Display deployment instructions
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📦 Build output location:${NC} $PROJECT_DIR/out"
echo ""

# Ask if user wants to deploy via SFTP
echo -e "${BLUE}🚀 Deploy to server?${NC}"
read -p "Deploy via SFTP/SCP? (y/N): " DEPLOY_ANSWER

if [[ "$DEPLOY_ANSWER" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}📡 SFTP Deployment${NC}"
    echo -e "${BLUE}==================${NC}"
    
    # Check if .env file exists and warn if not
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
        echo -e "${YELLOW}   Create .env file from .env.example for default values${NC}"
        echo ""
    fi
    
    # Default values from .env file (no hardcoded fallbacks)
    DEFAULT_HOST="${DEPLOY_HOST:-}"
    DEFAULT_USER="${DEPLOY_USER:-}"
    DEFAULT_PATH="${DEPLOY_PATH:-}"
    
    # Get host
    if [ -n "$DEFAULT_HOST" ]; then
        read -p "Host [$DEFAULT_HOST]: " SFTP_HOST
        SFTP_HOST="${SFTP_HOST:-$DEFAULT_HOST}"
    else
        read -p "Host: " SFTP_HOST
        if [ -z "$SFTP_HOST" ]; then
            echo -e "${RED}✗ Error: Host is required${NC}"
            exit 1
        fi
    fi
    
    # Get username
    if [ -n "$DEFAULT_USER" ]; then
        read -p "Username [$DEFAULT_USER]: " SFTP_USER
        SFTP_USER="${SFTP_USER:-$DEFAULT_USER}"
    else
        read -p "Username: " SFTP_USER
        if [ -z "$SFTP_USER" ]; then
            echo -e "${RED}✗ Error: Username is required${NC}"
            exit 1
        fi
    fi
    
    # Get path
    if [ -n "$DEFAULT_PATH" ]; then
        read -p "Remote path [$DEFAULT_PATH]: " SFTP_PATH
        SFTP_PATH="${SFTP_PATH:-$DEFAULT_PATH}"
    else
        read -p "Remote path: " SFTP_PATH
        if [ -z "$SFTP_PATH" ]; then
            echo -e "${RED}✗ Error: Remote path is required${NC}"
            exit 1
        fi
    fi
    
    echo ""
    echo -e "${BLUE}📋 Generating rsync command...${NC}"
    
    # Generate the rsync command
    RSYNC_CMD="rsync -avz --delete -e \"ssh -o StrictHostKeyChecking=no\" \"$PROJECT_DIR/out/\" \"$SFTP_USER@$SFTP_HOST:$SFTP_PATH/\""
    
    # Copy to clipboard (macOS)
    if command -v pbcopy &> /dev/null; then
        echo "$RSYNC_CMD" | pbcopy
        echo -e "  ${GREEN}✓ Command copied to clipboard${NC}"
    elif command -v xclip &> /dev/null; then
        echo "$RSYNC_CMD" | xclip -selection clipboard
        echo -e "  ${GREEN}✓ Command copied to clipboard${NC}"
    elif command -v xsel &> /dev/null; then
        echo "$RSYNC_CMD" | xsel --clipboard --input
        echo -e "  ${GREEN}✓ Command copied to clipboard${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Clipboard tool not found (pbcopy/xclip/xsel)${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📝 Rsync command:${NC}"
    echo -e "${YELLOW}$RSYNC_CMD${NC}"
    echo ""
    echo -e "${BLUE}💡 Instructions:${NC}"
    echo "  1. Paste the command above into your terminal"
    echo "  2. You'll be prompted for your password"
    echo "  3. The files will be uploaded to: $SFTP_USER@$SFTP_HOST:$SFTP_PATH"
    echo ""
    echo -e "${GREEN}✨ Ready to deploy!${NC}"
    echo ""
else
    echo ""
    echo -e "${BLUE}📋 Manual deployment steps:${NC}"
    echo "  1. Upload the contents of the 'out' directory to your Apache web root"
    echo "  2. Ensure Apache has mod_rewrite enabled"
    echo "  3. Verify .htaccess file is present and readable"
    echo ""
    echo -e "${GREEN}✨ Ready to deploy manually!${NC}"
fi

