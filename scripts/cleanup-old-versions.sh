#!/bin/bash

# Cleanup Old Versions Script
# Removes old npm versions and their corresponding git tags

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${1}${2}${NC}"
}

# Function to confirm action
confirm() {
    local message="$1"
    echo -n "$message (y/N): "
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Function to get current version from package.json
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to get published versions from npm
get_published_versions() {
    # Try to use jq if available, otherwise use node
    if command -v jq >/dev/null 2>&1; then
        npm view @rikaidev/cortex versions --json 2>/dev/null | jq -r '.[]' 2>/dev/null || echo ""
    else
        # Fallback to node for JSON parsing
        node -e "
            try {
                const versions = JSON.parse(require('child_process').execSync('npm view @rikaidev/cortex versions --json', {encoding: 'utf8'}));
                console.log(versions.join('\n'));
            } catch (e) {
                process.exit(1);
            }
        " 2>/dev/null || echo ""
    fi
}

# Function to compare versions (simple semver comparison)
version_compare() {
    local version1="$1"
    local version2="$2"

    # Remove 'v' prefix if present
    version1="${version1#v}"
    version2="${version2#v}"

    # Simple version comparison using sort -V
    if [ "$(printf '%s\n%s' "$version1" "$version2" | sort -V | head -n1)" = "$version1" ] && [ "$version1" != "$version2" ]; then
        return 1  # version1 < version2
    else
        return 0  # version1 >= version2
    fi
}

# Function to find versions older than current
get_old_versions() {
    local current_version="$1"
    local published_versions="$2"
    local old_versions=""

    for version in $published_versions; do
        if ! version_compare "$version" "$current_version" || [ "$version" = "$current_version" ]; then
            continue
        fi
        old_versions="$old_versions $version"
    done

    echo "$old_versions" | tr ' ' '\n' | sort -V
}

# Parse command line arguments
KEEP_LATEST=false
SPECIFIC_VERSIONS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-latest)
            KEEP_LATEST=true
            shift
            ;;
        --versions=*)
            SPECIFIC_VERSIONS="${1#*=}"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Clean up old versions of @rikaidev/cortex"
            echo ""
            echo "Options:"
            echo "  --keep-latest    Keep only the latest version, remove all others"
            echo "  --versions=LIST  Specify comma-separated list of versions to remove"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --keep-latest                    # Remove all versions except latest"
            echo "  $0 --versions=0.7.0,0.8.0,0.9.0   # Remove specific versions"
            echo "  $0                                  # Interactive mode (default)"
            exit 0
            ;;
        *)
            print_status $RED "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Get current version
CURRENT_VERSION=$(get_current_version)
print_status $BLUE "📦 Current version: $CURRENT_VERSION"

# Get published versions
PUBLISHED_VERSIONS=$(get_published_versions)

if [ -z "$PUBLISHED_VERSIONS" ]; then
    print_status $RED "❌ Failed to fetch published versions from npm"
    exit 1
fi

# Determine versions to remove
if [ -n "$SPECIFIC_VERSIONS" ]; then
    # Use specific versions provided
    IFS=',' read -ra VERSIONS_TO_REMOVE <<< "$SPECIFIC_VERSIONS"
    TAGS_TO_REMOVE=()
    for version in "${VERSIONS_TO_REMOVE[@]}"; do
        TAGS_TO_REMOVE+=("v$version")
    done
elif [ "$KEEP_LATEST" = true ]; then
    # Keep only latest version
    LATEST_VERSION=$(echo "$PUBLISHED_VERSIONS" | sort -V | tail -n1)
    VERSIONS_TO_REMOVE=()
    TAGS_TO_REMOVE=()

    for version in $PUBLISHED_VERSIONS; do
        if [ "$version" != "$LATEST_VERSION" ]; then
            VERSIONS_TO_REMOVE+=("$version")
            TAGS_TO_REMOVE+=("v$version")
        fi
    done
else
    # Interactive mode - remove versions older than current
    OLD_VERSIONS=$(get_old_versions "$CURRENT_VERSION" "$PUBLISHED_VERSIONS")

    if [ -z "$OLD_VERSIONS" ]; then
        print_status $GREEN "✅ No old versions to clean up"
        exit 0
    fi

    VERSIONS_TO_REMOVE=()
    TAGS_TO_REMOVE=()

    for version in $OLD_VERSIONS; do
        VERSIONS_TO_REMOVE+=("$version")
        TAGS_TO_REMOVE+=("v$version")
    done
fi

print_status $BLUE "🧹 Cortex AI Old Versions Cleanup Script"
echo
print_status $YELLOW "⚠️  This will permanently remove the following versions:"
echo

print_status $RED "📦 NPM Versions to unpublish:"
for version in "${VERSIONS_TO_REMOVE[@]}"; do
    echo "  - @rikaidev/cortex@$version"
done

echo
print_status $RED "🏷️  Git Tags to remove:"
for tag in "${TAGS_TO_REMOVE[@]}"; do
    echo "  - $tag"
done

echo
print_status $YELLOW "⚠️  This action CANNOT be undone!"
print_status $YELLOW "⚠️  Users depending on these versions will be affected!"
echo

if ! confirm "Are you sure you want to proceed?"; then
    print_status $BLUE "❌ Operation cancelled"
    exit 0
fi

echo
print_status $BLUE "🚀 Starting cleanup process..."

# Unpublish npm versions
print_status $BLUE "📦 Unpublishing npm versions..."
for version in "${VERSIONS_TO_REMOVE[@]}"; do
    print_status $YELLOW "  → Unpublishing @rikaidev/cortex@$version..."
    if npm unpublish "@rikaidev/cortex@$version" --force; then
        print_status $GREEN "  ✅ Successfully unpublished @rikaidev/cortex@$version"
    else
        print_status $RED "  ❌ Failed to unpublish @rikaidev/cortex@$version"
    fi
done

echo
# Remove git tags (local and remote)
print_status $BLUE "🏷️  Removing git tags..."
for tag in "${TAGS_TO_REMOVE[@]}"; do
    print_status $YELLOW "  → Removing tag $tag..."

    # Remove local tag
    if git tag -l | grep -q "^$tag$"; then
        git tag -d "$tag"
        print_status $GREEN "  ✅ Removed local tag $tag"
    else
        print_status $YELLOW "  ⚠️  Local tag $tag not found"
    fi

    # Remove remote tag
    if git ls-remote --tags origin | grep -q "refs/tags/$tag$"; then
        git push origin ":refs/tags/$tag"
        print_status $GREEN "  ✅ Removed remote tag $tag"
    else
        print_status $YELLOW "  ⚠️  Remote tag $tag not found"
    fi
done

echo
print_status $GREEN "🎉 Cleanup completed!"
print_status $BLUE "📊 Summary:"
echo "  • Unpublished ${#VERSIONS_TO_REMOVE[@]} npm versions"
echo "  • Removed ${#TAGS_TO_REMOVE[@]} git tags"
echo
print_status $YELLOW "💡 Current active version: 0.9.7"
