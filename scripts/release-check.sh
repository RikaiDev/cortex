#!/bin/bash

# Cortex AI Release Quality Check Script
# This script ensures all release requirements are met before publishing

set -e

echo "🔍 Cortex AI Release Quality Check"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ Error: $1 is not installed${NC}"
        exit 1
    fi
}

# Function to check date consistency
check_date() {
    echo -e "${BLUE}📅 Checking date consistency...${NC}"
    
    # Get current date and version
    CURRENT_DATE=$(date +"%Y-%m-%d")
    CURRENT_DATE_FULL=$(date)
    PACKAGE_VERSION=$(node -p "require('./package.json').version")
    
    echo "Current date: $CURRENT_DATE_FULL"
    echo "Package version: $PACKAGE_VERSION"
    
    # Check if CHANGELOG has correct date
    if grep -q "## \[$PACKAGE_VERSION\] - $CURRENT_DATE" CHANGELOG.md; then
        echo -e "${GREEN}✅ CHANGELOG date is correct${NC}"
    else
        echo -e "${RED}❌ CHANGELOG date is incorrect!${NC}"
        echo "Expected: $PACKAGE_VERSION - $CURRENT_DATE"
        echo "Please update CHANGELOG.md with correct date"
        exit 1
    fi
}

# Function to check version consistency
check_version() {
    echo -e "${BLUE}📦 Checking version consistency...${NC}"
    
    # Get version from package.json
    PACKAGE_VERSION=$(node -p "require('./package.json').version")
    
    # Check if version is in CHANGELOG
    if grep -q "## \[$PACKAGE_VERSION\]" CHANGELOG.md; then
        echo -e "${GREEN}✅ Version $PACKAGE_VERSION found in CHANGELOG${NC}"
    else
        echo -e "${RED}❌ Version $PACKAGE_VERSION not found in CHANGELOG!${NC}"
        exit 1
    fi
}

# Function to check build
check_build() {
    echo -e "${BLUE}🔨 Checking build...${NC}"
    
    if bun run build; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    fi
}

# Function to check tests
check_tests() {
    echo -e "${BLUE}🧪 Checking tests...${NC}"
    
    if bun test; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed!${NC}"
        exit 1
    fi
}

# Function to check linting
check_lint() {
    echo -e "${BLUE}🔍 Checking linting...${NC}"
    
    if bun run lint; then
        echo -e "${GREEN}✅ Linting passed${NC}"
    else
        echo -e "${RED}❌ Linting failed!${NC}"
        exit 1
    fi
}

# Function to check git status
check_git_status() {
    echo -e "${BLUE}📝 Checking git status...${NC}"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  There are uncommitted changes:${NC}"
        git status --porcelain
        echo -e "${YELLOW}Please commit all changes before release${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ No uncommitted changes${NC}"
    fi
    
    # Check if we're on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "main" ]; then
        echo -e "${GREEN}✅ On main branch${NC}"
    else
        echo -e "${RED}❌ Not on main branch! Current: $CURRENT_BRANCH${NC}"
        exit 1
    fi
}

# Function to check configuration files
check_config_files() {
    echo -e "${BLUE}⚙️  Checking configuration files...${NC}"
    
    # Check if CLAUDE file exists
    if [ -f "CLAUDE" ]; then
        echo -e "${GREEN}✅ CLAUDE file exists${NC}"
    else
        echo -e "${RED}❌ CLAUDE file missing!${NC}"
        exit 1
    fi
    
    # Check if GEMINI file exists
    if [ -f "GEMINI" ]; then
        echo -e "${GREEN}✅ GEMINI file exists${NC}"
    else
        echo -e "${RED}❌ GEMINI file missing!${NC}"
        exit 1
    fi
    
    # Check if Cursor MDC exists
    if [ -f ".cursor/rules/cortex.mdc" ]; then
        echo -e "${GREEN}✅ Cursor MDC exists${NC}"
    else
        echo -e "${RED}❌ Cursor MDC missing!${NC}"
        exit 1
    fi
}

# Function to check documentation
check_documentation() {
    echo -e "${BLUE}📚 Checking documentation...${NC}"
    
    # Check if ROADMAP is updated
    if grep -q "Cortex Agent System" ROADMAP.md; then
        echo -e "${GREEN}✅ ROADMAP is updated${NC}"
    else
        echo -e "${RED}❌ ROADMAP needs updating!${NC}"
        exit 1
    fi
    
    # Check if IMPROVEMENTS-SUMMARY exists
    if [ -f "docs/ai-collaboration/IMPROVEMENTS-SUMMARY.md" ]; then
        echo -e "${GREEN}✅ IMPROVEMENTS-SUMMARY exists${NC}"
    else
        echo -e "${RED}❌ IMPROVEMENTS-SUMMARY missing!${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting Cortex AI Release Quality Check${NC}"
    echo ""
    
    # Check required commands
    check_command "git"
    check_command "bun"
    check_command "node"
    
    # Run all checks
    check_date
    check_version
    check_build
    check_tests
    check_lint
    check_git_status
    check_config_files
    check_documentation
    
    echo ""
    echo -e "${GREEN}🎉 All checks passed! Ready for release.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. git add ."
    echo "2. git commit -m 'feat: release v$(node -p "require('./package.json').version")'"
    echo "3. git tag v$(node -p "require('./package.json').version")"
    echo "4. git push origin main --tags"
}

# Run main function
main "$@" 