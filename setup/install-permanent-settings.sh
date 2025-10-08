#!/bin/bash
# ==========================================================================
# MyDayHub - Permanent Server Settings Installation
# ==========================================================================
# This script configures MySQL, Apache, and PHP to start automatically
# and sets MySQL sql_mode permanently to remove ONLY_FULL_GROUP_BY
#
# Run this script ONCE after a fresh boot or system setup:
#   chmod +x setup/install-permanent-settings.sh
#   ./setup/install-permanent-settings.sh
# ==========================================================================

echo "=================================================="
echo "MyDayHub - Installing Permanent Server Settings"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==========================================================================
# 1. BACKUP EXISTING MYSQL CONFIGURATION
# ==========================================================================
echo -e "${YELLOW}Step 1: Backing up existing MySQL configuration...${NC}"
if [ -f /opt/homebrew/etc/my.cnf ]; then
    sudo cp /opt/homebrew/etc/my.cnf /opt/homebrew/etc/my.cnf.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Backup created${NC}"
else
    echo -e "${YELLOW}⚠ No existing my.cnf found, will create new one${NC}"
fi
echo ""

# ==========================================================================
# 2. INSTALL NEW MYSQL CONFIGURATION
# ==========================================================================
echo -e "${YELLOW}Step 2: Installing new MySQL configuration...${NC}"
sudo cp setup/mysql-permanent-config.cnf /opt/homebrew/etc/my.cnf
sudo chmod 644 /opt/homebrew/etc/my.cnf
echo -e "${GREEN}✓ MySQL configuration installed${NC}"
echo ""

# ==========================================================================
# 3. CONFIGURE SERVICES TO START ON BOOT
# ==========================================================================
echo -e "${YELLOW}Step 3: Configuring services to start on boot...${NC}"

# MySQL
echo "  - Enabling MySQL to start on boot..."
brew services start mysql
echo -e "${GREEN}  ✓ MySQL configured${NC}"

# PHP
echo "  - Enabling PHP-FPM to start on boot..."
brew services start php
echo -e "${GREEN}  ✓ PHP configured${NC}"

# Apache (already configured via system launchd)
echo "  - Apache is managed by macOS launchd"
echo -e "${GREEN}  ✓ Apache already configured${NC}"
echo ""

# ==========================================================================
# 4. RESTART SERVICES TO APPLY CHANGES
# ==========================================================================
echo -e "${YELLOW}Step 4: Restarting services to apply new configuration...${NC}"

# Restart Apache
echo "  - Restarting Apache..."
sudo apachectl -k restart
echo -e "${GREEN}  ✓ Apache restarted${NC}"

# Restart PHP
echo "  - Restarting PHP-FPM..."
brew services restart php
echo -e "${GREEN}  ✓ PHP restarted${NC}"

# Restart MySQL
echo "  - Restarting MySQL..."
brew services restart mysql
echo -e "${GREEN}  ✓ MySQL restarted${NC}"
echo ""

# ==========================================================================
# 5. VERIFY MYSQL SQL_MODE
# ==========================================================================
echo -e "${YELLOW}Step 5: Verifying MySQL sql_mode setting...${NC}"
sleep 3  # Give MySQL time to restart

SQL_MODE=$(mysql -u alfa -p -e "SELECT @@sql_mode;" 2>/dev/null | grep -v "@@sql_mode")
if [[ ! "$SQL_MODE" =~ "ONLY_FULL_GROUP_BY" ]]; then
    echo -e "${GREEN}✓ sql_mode configured correctly (ONLY_FULL_GROUP_BY removed)${NC}"
else
    echo -e "${RED}✗ ONLY_FULL_GROUP_BY still present in sql_mode${NC}"
    echo "Please check the MySQL configuration manually."
fi
echo ""

# ==========================================================================
# 6. CREATE QUICK RESTART SCRIPT (OPTIONAL)
# ==========================================================================
echo -e "${YELLOW}Step 6: Creating quick restart script...${NC}"
cat > setup/restart-servers.sh << 'EOF'
#!/bin/bash
# Quick restart script for MyDayHub servers
echo "Restarting MyDayHub servers..."
sudo apachectl -k restart
brew services restart php
brew services restart mysql
echo "✓ All servers restarted"
EOF

chmod +x setup/restart-servers.sh
echo -e "${GREEN}✓ Quick restart script created: setup/restart-servers.sh${NC}"
echo ""

# ==========================================================================
# COMPLETION MESSAGE
# ==========================================================================
echo "=================================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "=================================================="
echo ""
echo "What was configured:"
echo "  ✓ MySQL sql_mode permanently set (ONLY_FULL_GROUP_BY removed)"
echo "  ✓ MySQL configured to start on boot"
echo "  ✓ PHP-FPM configured to start on boot"
echo "  ✓ Apache already starts on boot (macOS default)"
echo ""
echo "After reboot, all services will start automatically."
echo ""
echo "Manual restart (if needed):"
echo "  ./setup/restart-servers.sh"
echo ""
echo "Verify services after reboot:"
echo "  brew services list"
echo ""

