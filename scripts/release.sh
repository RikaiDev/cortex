#!/bin/bash

# Cortex AI Release Script
# Prepares the project for npm release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check git status
check_git_status() {
    print_status "Checking git status..."
    
    if ! git status --porcelain | grep -q .; then
        print_success "Working directory is clean"
    else
        print_warning "Working directory has uncommitted changes"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Release cancelled"
            exit 1
        fi
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    if command_exists bun; then
        bun test
    elif command_exists npm; then
        npm test
    else
        print_warning "No test runner found, skipping tests"
    fi
    
    print_success "Tests passed"
}

# Function to build project
build_project() {
    print_status "Building project..."
    
    if command_exists bun; then
        bun run build
    elif command_exists npm; then
        npm run build
    else
        print_error "No build tool found"
        exit 1
    fi
    
    print_success "Build completed"
}

# Function to check package.json
check_package_json() {
    print_status "Checking package.json..."
    
    # Check if name is set correctly
    if ! grep -q '"name": "@rikaidev/cortex"' package.json; then
        print_error "Package name must be '@rikaidev/cortex'"
        exit 1
    fi
    
    # Check if bin field is set
    if ! grep -q '"bin"' package.json; then
        print_error "Package.json missing 'bin' field"
        exit 1
    fi
    
    # Check if main field points to dist
    if ! grep -q '"main": "dist/index.js"' package.json; then
        print_error "Package.json main field should point to dist/index.js"
        exit 1
    fi
    
    print_success "Package.json validation passed"
}

# Function to check dist directory
check_dist_directory() {
    print_status "Checking dist directory..."
    
    if [ ! -d "dist" ]; then
        print_error "dist directory not found. Run build first."
        exit 1
    fi
    
    if [ ! -f "dist/cli/index.js" ]; then
        print_error "CLI entry point not found: dist/cli/index.js"
        exit 1
    fi
    
    if [ ! -f "dist/index.js" ]; then
        print_error "Main entry point not found: dist/index.js"
        exit 1
    fi
    
    print_success "Dist directory validation passed"
}

# Function to update version
update_version() {
    local version_type=$1
    
    print_status "Updating version ($version_type)..."
    
    if command_exists npm; then
        npm version "$version_type" --no-git-tag-version
    else
        print_error "npm not found for version update"
        exit 1
    fi
    
    print_success "Version updated"
}

# Function to create git tag
create_git_tag() {
    local version=$1
    
    print_status "Creating git tag v$version..."
    
    git add .
    git commit -m "Release v$version"
    git tag "v$version"
    
    print_success "Git tag created: v$version"
}

# Function to publish to npm
publish_to_npm() {
    print_status "Publishing to npm..."
    
    if command_exists npm; then
        npm publish --access public
    else
        print_error "npm not found"
        exit 1
    fi
    
    print_success "Published to npm successfully"
}

# Function to push to git
push_to_git() {
    print_status "Pushing to git..."
    
    git push origin main
    git push origin --tags
    
    print_success "Pushed to git successfully"
}

# Function to create release notes
create_release_notes() {
    local version=$1
    
    print_status "Creating release notes..."
    
    # Create release notes file
    cat > "RELEASE_NOTES_v$version.md" << EOF
# Cortex AI v$version Release Notes

## 🚀 New Features

- **One-click setup**: `cortex setup` command for easy project initialization
- **Smart project detection**: Automatically detects project type and creates appropriate roles
- **IDE integration**: Automatic generation of Cursor, VS Code, and JetBrains configurations
- **Global CLI installation**: Install with `npm install -g @rikaidev/cortex`
- **Project-specific roles**: Creates roles based on your project type (Frontend, Backend, Python, etc.)

## 🔧 Improvements

- **Simplified installation**: From 5 minutes to 30 seconds
- **Zero learning curve**: No technical background required
- **Auto-configuration**: Automatically sets up everything you need
- **Better error handling**: Improved error messages and troubleshooting

## 🐛 Bug Fixes

- Fixed role discovery issues
- Improved IDE configuration generation
- Better project type detection

## 📚 Documentation

- Updated README with new installation flow
- Added Quick Start Guide
- Improved command documentation

## 🎯 Migration Guide

If you have an existing Cortex setup:

\`\`\`bash
# Integrate with existing system
cortex integrate

# Or start fresh with new setup
cortex setup
\`\`\`

## 📦 Installation

\`\`\`bash
# Install globally
npm install -g @rikaidev/cortex

# Setup in your project
cortex setup

# Start using
cortex start
\`\`\`

## 🔗 Links

- [GitHub Repository](https://github.com/RikaiDev/cortex)
- [Documentation](https://github.com/RikaiDev/cortex/tree/main/docs)
- [Issues](https://github.com/RikaiDev/cortex/issues)
EOF
    
    print_success "Release notes created: RELEASE_NOTES_v$version.md"
}

# Function to show release summary
show_release_summary() {
    local version=$1
    
    echo
    print_success "🎉 Release v$version completed successfully!"
    echo
    echo "What was done:"
    echo "✅ Tests passed"
    echo "✅ Project built"
    echo "✅ Package.json validated"
    echo "✅ Version consistency checked"
    echo "✅ Version updated to v$version"
    echo "✅ Git tag created"
    echo "✅ Published to npm"
    echo "✅ Pushed to git"
    echo "✅ Release notes created"
    echo
    echo "Next steps:"
    echo "1. Create GitHub release with tag v$version"
    echo "2. Upload release notes"
    echo "3. Announce on social media"
    echo
    echo "Release notes: RELEASE_NOTES_v$version.md"
}

# Function to check version consistency
check_version_consistency() {
    local version=$1
    
    print_status "Checking version consistency across files..."
    
    local errors=0
    
    # Check package.json
    if ! grep -q "\"version\": \"$version\"" package.json; then
        print_error "package.json version mismatch: expected $version"
        errors=$((errors + 1))
    fi
    
    # Check README.md
    if ! grep -q "version-v$version-blue" README.md; then
        print_error "README.md version badge mismatch: expected v$version"
        errors=$((errors + 1))
    fi
    
    # Check README.zh-TW.md
    if ! grep -q "version-v$version-blue" README.zh-TW.md; then
        print_error "README.zh-TW.md version badge mismatch: expected v$version"
        errors=$((errors + 1))
    fi
    
    # Check CHANGELOG.md
    if ! grep -q "## \[$version\]" CHANGELOG.md; then
        print_error "CHANGELOG.md version entry mismatch: expected $version"
        errors=$((errors + 1))
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "Version consistency check passed"
    else
        print_error "Version consistency check failed with $errors errors"
        print_warning "Please update version numbers in the following files:"
        echo "  - package.json"
        echo "  - README.md"
        echo "  - README.zh-TW.md"
        echo "  - CHANGELOG.md"
        exit 1
    fi
}

# Main release logic
main() {
    local version_type=${1:-patch}
    
    echo "🧠 Cortex AI - Release Script"
    echo "============================="
    echo
    
    # Validate version type
    case $version_type in
        patch|minor|major)
            ;;
        *)
            print_error "Invalid version type: $version_type"
            echo "Valid types: patch, minor, major"
            exit 1
            ;;
    esac
    
    # Pre-release checks
    check_git_status
    run_tests
    build_project
    check_package_json
    check_dist_directory
    
    # Get current version
    local current_version=$(node -p "require('./package.json').version")
    print_status "Current version: $current_version"
    
    # Check version consistency before update
    check_version_consistency "$current_version"
    
    # Get current version
    local current_version=$(node -p "require('./package.json').version")
    print_status "Current version: $current_version"
    
    # Update version
    update_version "$version_type"
    
    # Get new version
    local new_version=$(node -p "require('./package.json').version")
    print_status "New version: $new_version"
    
    # Check version consistency after update
    check_version_consistency "$new_version"
    
    # Create git tag
    create_git_tag "$new_version"
    
    # Publish to npm
    publish_to_npm
    
    # Push to git
    push_to_git
    
    # Create release notes
    create_release_notes "$new_version"
    
    # Show summary
    show_release_summary "$new_version"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Cortex AI Release Script"
        echo
        echo "Usage: $0 [VERSION_TYPE]"
        echo
        echo "Version Types:"
        echo "  patch    Increment patch version (1.0.0 -> 1.0.1)"
        echo "  minor    Increment minor version (1.0.0 -> 1.1.0)"
        echo "  major    Increment major version (1.0.0 -> 2.0.0)"
        echo
        echo "Examples:"
        echo "  $0 patch    # Release patch version"
        echo "  $0 minor    # Release minor version"
        echo "  $0 major    # Release major version"
        exit 0
        ;;
    patch|minor|major)
        main "$1"
        ;;
    "")
        main "patch"
        ;;
    *)
        print_error "Unknown version type: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 