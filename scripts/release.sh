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
        "current")
            echo "$current_version"
            ;;
        *)
            echo "$current_version"
            ;;
    esac
}

# Function to validate version consistency
validate_version_consistency() {
    local target_version=$1
    local package_version=$(get_current_version)
    local changelog_version=$(grep -E "^## \[[0-9]+\.[0-9]+\.[0-9]+\]" CHANGELOG.md | head -1 | sed 's/## \[\([0-9]*\.[0-9]*\.[0-9]*\)\].*/\1/')
    
    if [ "$package_version" != "$target_version" ]; then
        print_status $RED "❌ Version mismatch: package.json=$package_version, target=$target_version"
        print_status $YELLOW "💡 Please update package.json to match target version first"
        exit 1
    fi
    
    if [ "$changelog_version" != "$target_version" ]; then
        print_status $RED "❌ Version mismatch: CHANGELOG.md=$changelog_version, target=$target_version"
        print_status $YELLOW "💡 Please update CHANGELOG.md to match target version first"
        exit 1
    fi
    
    print_status $GREEN "✅ Version consistency validated: $target_version"
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
    local target_version=$(get_next_version $version_type)
    
    print_status $BLUE "🚀 Starting release process..."
    print_status $BLUE "Current version: $current_version"
    print_status $BLUE "Target version: $target_version"
    
    # 1. Validate version consistency
    print_status $BLUE "🔍 Validating version consistency..."
    validate_version_consistency $target_version
    
    # 2. Update version (only if not current)
    if [ "$version_type" != "current" ]; then
        print_status $BLUE "📦 Updating version to $target_version..."
        npm version $version_type --no-git-tag-version
        
        # 3. Update CHANGELOG
        print_status $BLUE "📝 Updating CHANGELOG..."
        update_changelog $target_version
    else
        print_status $BLUE "📦 Releasing current version: $target_version"
    fi
    
    # 3. Build project
    print_status $BLUE "🔨 Building project..."
    npm run build
    
    # 4. Build project
    print_status $BLUE "🔨 Building project..."
    npm run build
    
    # 5. Commit changes
    print_status $BLUE "📝 Committing changes..."
    git add .
    git commit -m "feat: release v$target_version"
    
    # 6. Create git tag
    print_status $BLUE "🏷️  Creating git tag..."
    git tag "v$target_version"
    
    # 7. Push to remote
    print_status $BLUE "📤 Pushing to remote..."
    git push origin main
    git push origin "v$target_version"
    
    # 8. Publish to npm
    print_status $BLUE "📦 Publishing to npm..."
    npm publish
    
    print_status $GREEN "🎉 Release v$target_version completed successfully!"
}

# Function to unpublish a version
unpublish_version() {
    local version=$1
    
    print_status $YELLOW "🗑️  Unpublishing version $version..."
    
    if npm unpublish "@rikaidev/cortex@$version" > /dev/null 2>&1; then
        print_status $GREEN "✅ Successfully unpublished $version"
    else
        print_status $RED "❌ Failed to unpublish $version"
        exit 1
    fi
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
    echo "  current        Release current version (no version bump)"
    echo "  patch          Release patch version (0.0.x)"
    echo "  minor          Release minor version (0.x.0)"
    echo "  major          Release major version (x.0.0)"
    echo "  --help, -h     Show this help message"
    echo "  --dry-run      Perform all checks without releasing"
    echo ""
    echo "Examples:"
    echo "  $0 current     Release current version (e.g., 0.6.1)"
    echo "  $0 patch       Release patch version (e.g., 0.6.1 → 0.6.2)"
    echo "  $0 minor       Release minor version (e.g., 0.6.1 → 0.7.0)"
    echo "  $0 major       Release major version (e.g., 0.6.1 → 1.0.0)"
    echo "  $0 --dry-run   Test release process without publishing"
    echo ""
    echo "Release Process:"
    echo "  1. Write CHANGELOG.md with target version"
    echo "  2. Update package.json version to match"
    echo "  3. Run: $0 current (to release current version)"
    echo "  4. Or run: $0 patch|minor|major (to bump and release)"
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
        "current")
            local version_type=$1
            local target_version=$(get_next_version $version_type)
            
            print_status $BLUE "🚀 Starting release process for current version..."
            
            # Pre-release checks
            pre_release_checks
            
            # Perform release
            perform_release $version_type
            
            # Post-release checks
            post_release_checks $target_version
            
            print_status $GREEN "🎉 Release v$target_version completed successfully!"
            ;;
        "patch"|"minor"|"major")
            local version_type=$1
            local target_version=$(get_next_version $version_type)
            
            print_status $BLUE "🚀 Starting release process for $version_type version..."
            
            # Pre-release checks
            pre_release_checks
            
            # Perform release
            perform_release $version_type
            
            # Post-release checks
            post_release_checks $target_version
            
            print_status $GREEN "🎉 Release v$target_version completed successfully!"
            ;;
        "unpublish")
            if [ -z "$2" ]; then
                print_status $RED "❌ Please specify version to unpublish: $0 unpublish <version>"
                exit 1
            fi
            unpublish_version $2
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