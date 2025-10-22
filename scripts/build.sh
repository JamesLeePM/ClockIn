#!/bin/bash

# ClockIn Build Script
# This script helps build the ClockIn app for different platforms

set -e

echo "🚀 ClockIn Build Script"
echo "======================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the ClockIn project root."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    print_error "Expo CLI is not installed. Please install it with: npm install -g @expo/cli"
    exit 1
fi

# Function to build for iOS
build_ios() {
    print_status "Building for iOS..."
    
    # Check if we're on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds can only be done on macOS"
        exit 1
    fi
    
    # Build for iOS
    expo build:ios --type simulator
    print_success "iOS build completed!"
}

# Function to build for Android
build_android() {
    print_status "Building for Android..."
    
    # Build for Android
    expo build:android --type apk
    print_success "Android build completed!"
}

# Function to build for web
build_web() {
    print_status "Building for web..."
    
    # Build for web
    expo build:web
    print_success "Web build completed!"
}

# Function to start development server
start_dev() {
    print_status "Starting development server..."
    expo start --clear
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Check if Jest is configured
    if [ ! -f "jest.config.js" ]; then
        print_warning "No Jest configuration found. Skipping tests."
        return
    fi
    
    npm test
    print_success "Tests completed!"
}

# Function to lint code
lint_code() {
    print_status "Linting code..."
    
    # Check if ESLint is configured
    if [ ! -f ".eslintrc.js" ] && [ ! -f ".eslintrc.json" ]; then
        print_warning "No ESLint configuration found. Skipping linting."
        return
    fi
    
    npx eslint src/ --ext .ts,.tsx
    print_success "Linting completed!"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  ios       Build for iOS (macOS only)"
    echo "  android   Build for Android"
    echo "  web       Build for web"
    echo "  dev       Start development server"
    echo "  test      Run tests"
    echo "  lint      Lint code"
    echo "  all       Build for all platforms"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 ios        # Build for iOS"
    echo "  $0 android    # Build for Android"
    echo "  $0 dev        # Start development server"
    echo "  $0 all        # Build for all platforms"
}

# Main script logic
case "${1:-help}" in
    ios)
        build_ios
        ;;
    android)
        build_android
        ;;
    web)
        build_web
        ;;
    dev)
        start_dev
        ;;
    test)
        run_tests
        ;;
    lint)
        lint_code
        ;;
    all)
        print_status "Building for all platforms..."
        build_ios
        build_android
        build_web
        print_success "All builds completed!"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

print_success "Script completed successfully! 🎉"
