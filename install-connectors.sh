#!/bin/bash

# Conveyor Connector Installation Script
# Installs all required dependencies for the new data source connectors

set -e  # Exit on error

echo "========================================"
echo "Conveyor Connector Installation"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "conveyor-server/requirements.txt" ]; then
    echo "❌ Error: Please run this script from the conveyor project root directory"
    exit 1
fi

echo "📦 Installing Python dependencies..."
echo ""

cd conveyor-server

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "✓ Found existing virtual environment"
    source venv/bin/activate
elif [ -d "../venv" ]; then
    echo "✓ Found virtual environment in parent directory"
    source ../venv/bin/activate
else
    echo "⚠️  No virtual environment found. Installing globally (not recommended)"
    echo "   Consider creating a virtual environment first:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo ""
    read -p "Continue with global installation? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Upgrade pip
echo "📦 Upgrading pip..."
python3 -m pip install --upgrade pip

# Install requirements
echo ""
echo "📦 Installing connector dependencies..."
pip install -r requirements.txt

echo ""
echo "========================================"
echo "✅ Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Run database migrations:"
echo "   python manage.py migrate"
echo ""
echo "2. Seed the source catalog:"
echo "   python manage.py seed_source_catalog"
echo ""
echo "3. Start the server:"
echo "   python manage.py runserver"
echo ""
echo "4. Check the logs for connector registration:"
echo "   Look for: 'Registered connectors: mysql, postgresql, mongodb, ...'"
echo ""
echo "See CONNECTOR_IMPLEMENTATION.md for detailed documentation."
echo ""
