#!/bin/bash

# Cortex AI Installation Script
# Supports multiple installation methods

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

# Function to detect package manager
detect_package_manager() {
    if command_exists npm; then
        echo "npm"
    elif command_exists bun; then
        echo "bun"
    elif command_exists yarn; then
        echo "yarn"
    else
        echo "none"
    fi
}

# Function to install with npm
install_with_npm() {
    print_status "Installing Cortex with npm..."
    npm install -g @rikaidev/cortex
    print_success "Cortex installed successfully with npm!"
}

# Function to install with bun
install_with_bun() {
    print_status "Installing Cortex with bun..."
    bun add -g @rikaidev/cortex
    print_success "Cortex installed successfully with bun!"
}

# Function to install with yarn
install_with_yarn() {
    print_status "Installing Cortex with yarn..."
    yarn global add @rikaidev/cortex
    print_success "Cortex installed successfully with yarn!"
}

# Function to download and install binary
install_binary() {
    print_status "Downloading Cortex binary..."
    
    # Detect OS and architecture
    OS="$(uname -s)"
    ARCH="$(uname -m)"
    
    case "$OS" in
        Linux*)     PLATFORM="linux" ;;
        Darwin*)    PLATFORM="darwin" ;;
        CYGWIN*)    PLATFORM="windows" ;;
        MINGW*)     PLATFORM="windows" ;;
        *)          print_error "Unsupported OS: $OS"; exit 1 ;;
    esac
    
    case "$ARCH" in
        x86_64)     ARCH="x64" ;;
        arm64)      ARCH="arm64" ;;
        aarch64)    ARCH="arm64" ;;
        *)          print_error "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    
    # Download URL (replace with actual release URL)
    DOWNLOAD_URL="https://github.com/RikaiDev/cortex/releases/latest/download/cortex-${PLATFORM}-${ARCH}"
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    
    # Download binary
    if command_exists curl; then
        curl -L -o "$TEMP_DIR/cortex" "$DOWNLOAD_URL"
    elif command_exists wget; then
        wget -O "$TEMP_DIR/cortex" "$DOWNLOAD_URL"
    else
        print_error "Neither curl nor wget found. Please install one of them."
        exit 1
    fi
    
    # Make executable
    chmod +x "$TEMP_DIR/cortex"
    
    # Move to system path
    if [ -w /usr/local/bin ]; then
        sudo mv "$TEMP_DIR/cortex" /usr/local/bin/
    elif [ -w "$HOME/.local/bin" ]; then
        mkdir -p "$HOME/.local/bin"
        mv "$TEMP_DIR/cortex" "$HOME/.local/bin/"
        print_warning "Please add $HOME/.local/bin to your PATH"
    else
        print_error "Cannot write to system directories. Please run with sudo or install manually."
        exit 1
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    print_success "Cortex binary installed successfully!"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    if command_exists cortex; then
        VERSION=$(cortex --version 2>/dev/null || echo "unknown")
        print_success "Cortex is installed! Version: $VERSION"
        return 0
    else
        print_error "Cortex installation verification failed"
        return 1
    fi
}

# Function to show setup instructions
show_setup_instructions() {
    echo
    print_status "🎉 Installation complete! Here's how to get started:"
    echo
    echo "1. Navigate to your project:"
    echo "   cd your-project"
    echo
    echo "2. Setup Cortex in your project:"
    echo "   cortex setup"
    echo
    echo "3. Start using Cortex:"
    echo "   cortex start"
    echo
    echo "For more information, visit: https://github.com/RikaiDev/cortex"
    echo
}

# Main installation logic
main() {
    echo "🧠 Cortex AI - Installation Script"
    echo "=================================="
    echo
    
    # Check if already installed
    if command_exists cortex; then
        print_warning "Cortex appears to be already installed"
        read -p "Do you want to reinstall? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Installation cancelled"
            exit 0
        fi
    fi
    
    # Detect package manager
    PACKAGE_MANAGER=$(detect_package_manager)
    
    if [ "$PACKAGE_MANAGER" = "none" ]; then
        print_warning "No package manager detected. Installing binary..."
        install_binary
    else
        print_status "Detected package manager: $PACKAGE_MANAGER"
        
        # Ask user for preference
        echo "Choose installation method:"
        echo "1. Use $PACKAGE_MANAGER (recommended)"
        echo "2. Download binary"
        echo "3. Manual installation"
        
        read -p "Enter your choice (1-3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                case $PACKAGE_MANAGER in
                    npm) install_with_npm ;;
                    bun) install_with_bun ;;
                    yarn) install_with_yarn ;;
                esac
                ;;
            2)
                install_binary
                ;;
            3)
                print_status "Manual installation instructions:"
                echo "1. Visit: https://github.com/RikaiDev/cortex"
                echo "2. Follow the installation guide"
                exit 0
                ;;
            *)
                print_error "Invalid choice"
                exit 1
                ;;
        esac
    fi
    
    # Verify installation
    if verify_installation; then
        show_setup_instructions
    else
        print_error "Installation failed. Please try again or contact support."
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Cortex AI Installation Script"
        echo
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --npm         Force npm installation"
        echo "  --bun         Force bun installation"
        echo "  --yarn        Force yarn installation"
        echo "  --binary      Force binary installation"
        echo
        echo "Examples:"
        echo "  $0              # Auto-detect and install"
        echo "  $0 --npm        # Install with npm"
        echo "  $0 --binary     # Install binary"
        exit 0
        ;;
    --npm)
        install_with_npm
        verify_installation && show_setup_instructions
        exit 0
        ;;
    --bun)
        install_with_bun
        verify_installation && show_setup_instructions
        exit 0
        ;;
    --yarn)
        install_with_yarn
        verify_installation && show_setup_instructions
        exit 0
        ;;
    --binary)
        install_binary
        verify_installation && show_setup_instructions
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 