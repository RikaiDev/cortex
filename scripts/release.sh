#!/bin/bash

# 🚀 Enhanced Automated Release Script
# This script performs a complete release process with quality checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to get current version
get_current_version() {
    npm pkg get version | tr -d '"'
}

# Function to get next version
get_next_version() {
    local type=$1
    local current_version=$(get_current_version)
    
    case $type in
        "patch")
            echo "$current_version" | awk -F. '{print $1"."$2"."$3+1}'
            ;;
        "minor")
            echo "$current_version" | awk -F. '{print $1"."$2+1".0"}'
            ;;
        "major")
            echo "$current_version" | awk -F. '{print $1+1".0.0"}'
            ;;
        *)
            echo "$current_version"
            ;;
    esac
}

# Function to update CHANGELOG
update_changelog() {
    local version=$1
    local date=$(date +"%Y-%m-%d")
    
    # Create temporary changelog entry
    cat > /tmp/changelog_entry.md << EOF
## [$version] - $date

### Added
- [Add new features here]

### Changed
- [Add changes here]

### Fixed
- [Add fixes here]

### Technical
- [Add technical details here]

EOF

    # Insert at the top of CHANGELOG.md (after the header)
    sed -i.bak "3r /tmp/changelog_entry.md" CHANGELOG.md
    rm /tmp/changelog_entry.md
    rm CHANGELOG.md.bak
    
    print_status $GREEN "✅ CHANGELOG updated for version $version"
}

# Function to perform pre-release checks
pre_release_checks() {
    print_status $BLUE "🔍 Running pre-release quality checks..."
    
    if ! ./scripts/release-check.sh --auto; then
        print_status $RED "❌ Pre-release checks failed"
        exit 1
    fi
    
    print_status $GREEN "✅ Pre-release checks passed"
}

# Function to perform release
perform_release() {
    local version_type=$1
    local current_version=$(get_current_version)
    local next_version=$(get_next_version $version_type)
    
    print_status $BLUE "🚀 Starting release process..."
    print_status $BLUE "Current version: $current_version"
    print_status $BLUE "Next version: $next_version"
    
    # 1. Update version
    print_status $BLUE "📦 Updating version to $next_version..."
    npm version $version_type --no-git-tag-version
    
    # 2. Update CHANGELOG
    print_status $BLUE "📝 Updating CHANGELOG..."
    update_changelog $next_version
    
    # 3. Build project
    print_status $BLUE "🔨 Building project..."
    npm run build
    
    # 4. Commit changes
    print_status $BLUE "📝 Committing changes..."
    git add .
    git commit -m "feat: release v$next_version"
    
    # 5. Create git tag
    print_status $BLUE "🏷️  Creating git tag..."
    git tag "v$next_version"
    
    # 6. Push to remote
    print_status $BLUE "📤 Pushing to remote..."
    git push origin main
    git push origin "v$next_version"
    
    # 7. Publish to npm
    print_status $BLUE "📦 Publishing to npm..."
    npm publish
    
    print_status $GREEN "🎉 Release v$next_version completed successfully!"
}

# Function to perform post-release checks
post_release_checks() {
    local version=$1
    
    print_status $BLUE "🔍 Running post-release checks..."
    
    # Wait a moment for npm to process
    sleep 5
    
    # Check if package is available on npm
    if npm view "@rikaidev/cortex@$version" version > /dev/null 2>&1; then
        print_status $GREEN "✅ Package published successfully to npm"
    else
        print_status $YELLOW "⚠️  Package not yet available on npm (may take a few minutes)"
    fi
    
    # Test installation
    print_status $BLUE "🧪 Testing package installation..."
    if npm install -g "@rikaidev/cortex@$version" > /dev/null 2>&1; then
        print_status $GREEN "✅ Package installation test passed"
    else
        print_status $RED "❌ Package installation test failed"
        exit 1
    fi
    
    # Test CLI functionality
    print_status $BLUE "🧪 Testing CLI functionality..."
    if cortex --version > /dev/null 2>&1; then
        print_status $GREEN "✅ CLI functionality test passed"
    else
        print_status $RED "❌ CLI functionality test failed"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "🚀 Enhanced Release Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  patch          Release patch version (0.0.x)"
    echo "  minor          Release minor version (0.x.0)"
    echo "  major          Release major version (x.0.0)"
    echo "  --help, -h     Show this help message"
    echo "  --dry-run      Perform all checks without releasing"
    echo ""
    echo "Examples:"
    echo "  $0 patch       Release patch version"
    echo "  $0 minor       Release minor version"
    echo "  $0 major       Release major version"
    echo "  $0 --dry-run   Test release process without publishing"
}

# Function to perform dry run
dry_run() {
    print_status $YELLOW "🧪 Performing dry run..."
    
    # Run pre-release checks
    pre_release_checks
    
    # Show what would be done
    local current_version=$(get_current_version)
    local next_version=$(get_next_version "patch")
    
    print_status $BLUE "📋 Dry run summary:"
    echo "  • Current version: $current_version"
    echo "  • Next version: $next_version"
    echo "  • Would update CHANGELOG"
    echo "  • Would commit changes"
    echo "  • Would create git tag"
    echo "  • Would push to remote"
    echo "  • Would publish to npm"
    
    print_status $GREEN "✅ Dry run completed successfully"
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_status $RED "❌ package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Parse arguments
    case "$1" in
        "patch"|"minor"|"major")
            local version_type=$1
            local next_version=$(get_next_version $version_type)
            
            print_status $BLUE "🚀 Starting release process for $version_type version..."
            
            # Pre-release checks
            pre_release_checks
            
            # Perform release
            perform_release $version_type
            
            # Post-release checks
            post_release_checks $next_version
            
            print_status $GREEN "🎉 Release v$next_version completed successfully!"
            ;;
        "--dry-run"|"-d")
            dry_run
            ;;
        "--help"|"-h"|"")
            show_help
            ;;
        *)
            print_status $RED "❌ Invalid option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 