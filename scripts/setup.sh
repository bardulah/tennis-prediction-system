#!/bin/bash

# Tennis Prediction System Setup Script
# This script sets up the development environment

set -e

echo "🎾 Setting up Tennis Prediction System..."

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

# Check if required commands exist
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install $1 and try again."
        exit 1
    else
        print_success "$1 is installed"
    fi
}

# Check Node.js version
check_node_version() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | sed 's/v//')
        REQUIRED_VERSION="16.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
        else
            print_error "Node.js version $NODE_VERSION is too old. Required: >= $REQUIRED_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
}

# Check required commands
print_status "Checking system requirements..."
check_command "node"
check_command "npm"
check_command "git"
check_node_version

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp config/.env.example .env
    print_warning "Please edit .env file with your actual configuration values"
else
    print_success ".env file already exists"
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Setup dashboard backend
if [ -d "dashboard/backend" ]; then
    print_status "Setting up Go backend..."
    cd dashboard/backend
    go mod download
    go mod tidy
    cd ../../
    print_success "Backend dependencies installed"
else
    print_warning "Dashboard backend directory not found, skipping..."
fi

# Setup dashboard frontend
if [ -d "dashboard/frontend" ]; then
    print_status "Setting up React frontend..."
    cd dashboard/frontend
    npm install
    cd ../../
    print_success "Frontend dependencies installed"
else
    print_warning "Dashboard frontend directory not found, skipping..."
fi

# Make scripts executable
print_status "Making scripts executable..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x scraping/*.sh 2>/dev/null || true

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p data
mkdir -p backups

# Setup database (if PostgreSQL is available)
if command -v psql &> /dev/null; then
    print_status "Setting up database..."
    
    read -p "Do you want to setup the database schema? (y/N): " setup_db
    if [[ $setup_db =~ ^[Yy]$ ]]; then
        read -p "Enter PostgreSQL connection string (or press Enter to skip): " db_url
        
        if [ ! -z "$db_url" ]; then
            print_status "Running database schema..."
            PGPASSWORD=${db_url##*:@} psql "${db_url}" -f database/schema.sql
            print_success "Database schema created"
        else
            print_warning "Skipping database setup"
        fi
    fi
else
    print_warning "PostgreSQL not found, skipping database setup"
fi

# Display next steps
print_success "Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration values:"
echo "   - Database connection string"
echo "   - OpenAI API key"
echo "   - Pinecone API key"
echo "   - n8n webhook URLs"
echo ""
echo "2. Import n8n workflows:"
echo "   - Import workflows/morning-workflow.json"
echo "   - Import workflows/evening-workflow.json"
echo ""
echo "3. Configure your services:"
echo "   - Set up PostgreSQL database"
echo "   - Configure n8n instance"
echo "   - Set up Pinecone vector database"
echo ""
echo "4. Start development:"
echo "   - npm run dev (start web scraper)"
echo "   - cd dashboard/backend && go run . (start backend)"
echo "   - cd dashboard/frontend && npm run dev (start frontend)"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - docs/ARCHITECTURE.md - Detailed architecture"
echo "   - docs/DEPLOYMENT_GUIDE.md - Deployment instructions"
echo ""
print_success "Happy coding! 🎾"
