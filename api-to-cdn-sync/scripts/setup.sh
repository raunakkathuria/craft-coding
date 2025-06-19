#!/bin/bash

# API-to-CDN Sync Setup Script
# Helps configure the environment for Phase 1 deployment

set -e

echo "🚀 API-to-CDN Sync Setup"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
ENV_EXAMPLE="$PROJECT_DIR/.env.example"

echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local default="$2"
    local secret="$3"

    if [ "$secret" = "true" ]; then
        echo -n "$prompt: "
        read -s value
        echo ""
    else
        echo -n "$prompt${default:+ (default: $default)}: "
        read value
        value="${value:-$default}"
    fi

    echo "$value"
}

# Function to validate token format
validate_token() {
    local token="$1"
    local min_length="$2"

    if [ ${#token} -lt $min_length ]; then
        echo -e "${RED}❌ Token too short (minimum $min_length characters)${NC}"
        return 1
    fi

    return 0
}

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️ .env file already exists${NC}"
    echo -n "Do you want to overwrite it? (y/N): "
    read overwrite

    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Setup cancelled."
        exit 0
    fi

    # Backup existing .env
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backed up existing .env file${NC}"
fi

echo "📝 Environment Configuration"
echo "----------------------------"
echo ""

# API Configuration
echo -e "${BLUE}🔗 API Configuration${NC}"
API_AUTH_TOKEN=$(prompt_input "API Auth Token" "test-token-123" false)

if ! validate_token "$API_AUTH_TOKEN" 8; then
    echo -e "${RED}Using default token for development. Change this for production!${NC}"
    API_AUTH_TOKEN="test-token-123"
fi

echo ""

# Cloudflare Configuration
echo -e "${BLUE}☁️ Cloudflare CDN Configuration${NC}"
echo "You can get these values from your Cloudflare dashboard:"
echo "- API Token: https://dash.cloudflare.com/profile/api-tokens"
echo "- Zone ID: Domain overview page"
echo "- Account ID: Right sidebar on dashboard"
echo ""

CLOUDFLARE_API_TOKEN=$(prompt_input "Cloudflare API Token" "your-cloudflare-api-token" true)
CLOUDFLARE_ZONE_ID=$(prompt_input "Cloudflare Zone ID" "your-zone-id" false)
CLOUDFLARE_ACCOUNT_ID=$(prompt_input "Cloudflare Account ID" "your-account-id" false)

echo ""

# Environment Selection
echo -e "${BLUE}🎯 Environment Configuration${NC}"
echo "1) development"
echo "2) production"
echo -n "Select environment (1-2, default: 1): "
read env_choice

case $env_choice in
    2)
        NODE_ENV="production"
        echo -e "${YELLOW}⚠️ Production environment selected${NC}"
        ;;
    *)
        NODE_ENV="development"
        echo -e "${GREEN}✅ Development environment selected${NC}"
        ;;
esac

echo ""

# Optional overrides
echo -e "${BLUE}⚙️ Optional Overrides${NC}"
echo "Leave blank to use defaults from cloudflare/config.json"
echo ""

CLOUDFLARE_NAMESPACE_ID=$(prompt_input "Custom Namespace ID (optional)" "" false)
CDN_DOMAIN=$(prompt_input "Custom CDN Domain (optional)" "" false)

echo ""

# Create .env file
echo "📄 Creating .env file..."

cat > "$ENV_FILE" << EOF
# API Configuration
API_AUTH_TOKEN=$API_AUTH_TOKEN

# Cloudflare CDN Configuration
CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
CLOUDFLARE_ZONE_ID=$CLOUDFLARE_ZONE_ID
CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID

# Environment
NODE_ENV=$NODE_ENV

# Optional Overrides
EOF

if [ ! -z "$CLOUDFLARE_NAMESPACE_ID" ]; then
    echo "CLOUDFLARE_NAMESPACE_ID=$CLOUDFLARE_NAMESPACE_ID" >> "$ENV_FILE"
fi

if [ ! -z "$CDN_DOMAIN" ]; then
    echo "CDN_DOMAIN=$CDN_DOMAIN" >> "$ENV_FILE"
fi

echo -e "${GREEN}✅ .env file created successfully${NC}"
echo ""

# Security check
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✅ Set secure permissions on .env file${NC}"

# Validate setup
echo ""
echo "🔍 Validating Setup"
echo "-------------------"

cd "$PROJECT_DIR/src"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Test configuration validation
echo "🧪 Testing configuration..."
if npm run validate:config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Configuration validation passed${NC}"
else
    echo -e "${YELLOW}⚠️ Configuration validation failed${NC}"
    echo "This is expected if you haven't set up real Cloudflare credentials yet."
    echo "You can still use the mock API for testing."
fi

echo ""

# Setup summary
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🧪 Test the sync process:"
echo "   cd src && npm run sync"
echo ""
echo "2. 🚀 Test deployment (will fail without real Cloudflare setup):"
echo "   cd src && npm run deploy"
echo ""
echo "3. ✅ Validate configuration:"
echo "   cd src && npm run validate:config"
echo ""
echo "4. 🔧 For GitHub Actions:"
echo "   - Add secrets to your repository settings"
echo "   - API_AUTH_TOKEN"
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - CLOUDFLARE_ZONE_ID"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo ""
echo "5. 📖 Update Cloudflare configuration:"
echo "   - Edit cloudflare/config.json"
echo "   - Set real namespace IDs and CDN domains"
echo ""

if [ "$NODE_ENV" = "development" ]; then
    echo -e "${BLUE}💡 Development Mode Tips:${NC}"
    echo "- Mock API server will be used for testing"
    echo "- CDN deployment may fail without real Cloudflare setup"
    echo "- This is perfect for Phase 1a testing"
else
    echo -e "${YELLOW}⚠️ Production Mode:${NC}"
    echo "- Ensure all Cloudflare credentials are correct"
    echo "- Test thoroughly in development first"
    echo "- Monitor deployments closely"
fi

echo ""
echo -e "${GREEN}Happy syncing! 🚀${NC}"
