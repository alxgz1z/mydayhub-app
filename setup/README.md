# MyDayHub Server Setup - Permanent Configuration

This directory contains scripts and configurations to make your MyDayHub development environment start automatically on boot, eliminating the need for manual server configuration after every restart.

## What This Solves

**Before:** After every Mac restart, you had to manually run:
```bash
sudo apachectl -k restart
brew services restart php
brew services restart mysql
mysql -u alfa -p  
sql> SET GLOBAL sql_mode = (SELECT REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', ''));
sql> exit
```

**After:** All services start automatically on boot with correct configuration!

---

## Quick Installation

**Run this once** to configure everything permanently:

```bash
cd /Library/WebServer/Documents
chmod +x setup/install-permanent-settings.sh
./setup/install-permanent-settings.sh
```

You'll need to enter your password when prompted (for `sudo` commands).

---

## What Gets Configured

### 1. **MySQL sql_mode (Permanent)**
- Removes `ONLY_FULL_GROUP_BY` from sql_mode
- Configuration stored in `/opt/homebrew/etc/my.cnf`
- Applied automatically on every MySQL startup

### 2. **Auto-Start Services on Boot**
- **MySQL**: Starts automatically via `brew services`
- **PHP-FPM**: Starts automatically via `brew services`
- **Apache**: Already configured by macOS to start on boot

### 3. **MySQL Performance Tuning**
- Increased max_connections to 200
- Optimized InnoDB buffer pool (256M)
- UTF8MB4 character set (proper emoji support)

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `mysql-permanent-config.cnf` | MySQL configuration with sql_mode fix |
| `install-permanent-settings.sh` | Main installation script |
| `restart-servers.sh` | Quick manual restart (created after install) |
| `README.md` | This documentation |

---

## Verification

### After Installation

Check that services are configured to start on boot:
```bash
brew services list
```

You should see:
```
mysql   started
php     started
```

### After Reboot

Verify MySQL sql_mode is correct:
```bash
mysql -u alfa -p -e "SELECT @@sql_mode;"
```

The output should **NOT** contain `ONLY_FULL_GROUP_BY`.

### Check Service Status

```bash
# Check Apache
sudo apachectl status

# Check MySQL
brew services info mysql

# Check PHP
brew services info php
```

---

## Manual Restart (If Needed)

If you need to manually restart all services:

```bash
./setup/restart-servers.sh
```

Or individually:
```bash
sudo apachectl -k restart          # Apache
brew services restart php           # PHP-FPM
brew services restart mysql         # MySQL
```

---

## Troubleshooting

### Services Not Starting on Boot

If services don't start after reboot:

1. **Check service status:**
   ```bash
   brew services list
   ```

2. **Manually start services:**
   ```bash
   brew services start mysql
   brew services start php
   ```

3. **Check for errors:**
   ```bash
   tail -f /opt/homebrew/var/log/mysql/error.log
   ```

### ONLY_FULL_GROUP_BY Still Appearing

If the sql_mode still contains `ONLY_FULL_GROUP_BY`:

1. **Verify configuration file:**
   ```bash
   cat /opt/homebrew/etc/my.cnf
   ```

2. **Restart MySQL:**
   ```bash
   brew services restart mysql
   ```

3. **Check again:**
   ```bash
   mysql -u alfa -p -e "SELECT @@sql_mode;"
   ```

### Permission Issues

If you get permission errors:

```bash
# Fix MySQL config permissions
sudo chmod 644 /opt/homebrew/etc/my.cnf

# Fix setup script permissions
chmod +x setup/install-permanent-settings.sh
```

---

## Reverting Changes

### To Restore Original MySQL Config

Backups are created automatically with timestamp:

```bash
# List backups
ls -la /opt/homebrew/etc/my.cnf.backup.*

# Restore specific backup
sudo cp /opt/homebrew/etc/my.cnf.backup.YYYYMMDD_HHMMSS /opt/homebrew/etc/my.cnf
brew services restart mysql
```

### To Disable Auto-Start Services

```bash
brew services stop mysql
brew services stop php
```

Apache will still start on boot (macOS default). To disable:
```bash
sudo launchctl unload -w /System/Library/LaunchDaemons/org.apache.httpd.plist
```

---

## Advanced Configuration

### Customizing MySQL Settings

Edit `/opt/homebrew/etc/my.cnf` to customize:

```ini
[mysqld]
# Your custom settings here
max_connections = 500
innodb_buffer_pool_size = 512M
```

After changes:
```bash
brew services restart mysql
```

### Customizing PHP Settings

Edit PHP config:
```bash
# Find PHP config location
php --ini

# Common location:
nano /opt/homebrew/etc/php/8.x/php.ini
```

After changes:
```bash
brew services restart php
```

---

## Support

If you encounter issues:

1. Check the error logs:
   - MySQL: `/opt/homebrew/var/log/mysql/error.log`
   - PHP: `/opt/homebrew/var/log/php-fpm.log`
   - Apache: `/var/log/apache2/error_log`

2. Verify configuration:
   ```bash
   mysql -u alfa -p -e "SHOW VARIABLES LIKE 'sql_mode';"
   ```

3. Re-run the installation script:
   ```bash
   ./setup/install-permanent-settings.sh
   ```

---

## Security Notes

- MySQL is configured to only accept connections from localhost (`127.0.0.1`)
- This prevents network access to your database for security
- If you need network access, edit `/opt/homebrew/etc/my.cnf` and remove/modify the `bind-address` setting

---

**Last Updated:** 2025-10-08  
**MyDayHub Version:** Beta 7.8

