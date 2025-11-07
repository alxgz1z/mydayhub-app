# Breveasy.com Auto-Deployment Diagnostic Guide

## Current Situation
- **Local Repository**: Up to date with GitHub (330 commits)
- **GitHub Repository**: Synced (330 commits)
- **Breveasy.com**: Not auto-deploying from GitHub

## Hostinger Git Integration Methods

Hostinger typically supports auto-deployment through one of these methods:

### Method 1: Git Integration Panel (Most Common)
1. Log into Hostinger Control Panel
2. Navigate to **Domains** → **breveasy.com** → **Git Integration**
3. Check if repository is connected
4. Verify:
   - Repository URL: `https://github.com/alxgz1z/mydayhub-app.git`
   - Branch: `main`
   - Auto-pull: Enabled
   - Webhook URL: Should be displayed (if configured)

### Method 2: Webhook-Based Deployment
If Hostinger provides a webhook URL:
1. Go to GitHub → Repository → Settings → Webhooks
2. Check if webhook exists for breveasy.com
3. Verify webhook is active and receiving events
4. Check recent deliveries for errors

### Method 3: Cron Job Auto-Pull
Hostinger may use a cron job to periodically pull from GitHub:
1. Check Hostinger → Cron Jobs
2. Look for a job that runs `git pull` in the breveasy.com directory
3. Verify it's running and check logs

## Diagnostic Steps

### Step 1: Verify Git Repository on Breveasy.com
SSH into breveasy.com and check:
```bash
cd /path/to/breveasy/public_html
git status
git log --oneline -5
git remote -v
```

### Step 2: Test Manual Pull
SSH into breveasy.com and manually pull:
```bash
cd /path/to/breveasy/public_html
git fetch origin
git pull origin main
```

If this works, the issue is with the auto-deployment mechanism.

### Step 3: Check Hostinger Git Integration
1. Log into Hostinger Control Panel
2. Find Git Integration settings for breveasy.com
3. Verify:
   - Repository is connected
   - Branch is set to `main`
   - Auto-pull is enabled
   - Check for any error messages

### Step 4: Test GitHub Webhook (if applicable)
1. Go to GitHub → Repository → Settings → Webhooks
2. Add webhook if missing:
   - Payload URL: [Hostinger webhook URL]
   - Content type: `application/json`
   - Events: `Just the push event`
   - Active: ✓
3. Test webhook delivery

### Step 5: Check File Permissions
SSH into breveasy.com:
```bash
cd /path/to/breveasy/public_html
ls -la .git
# Ensure .git directory is readable
```

## Alternative: GitHub Actions Deployment

I've created `.github/workflows/deploy-breveasy.yml` as an alternative deployment method.

### Setup GitHub Actions:
1. Go to GitHub → Repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `BREVEASY_HOST`: SSH hostname/IP (e.g., `212.85.29.103`)
   - `BREVEASY_USER`: SSH username (e.g., `u756585617`)
   - `BREVEASY_PORT`: SSH port (e.g., `65002`)
   - `BREVEASY_SSH_KEY`: Private SSH key for breveasy.com
   - `BREVEASY_PATH`: Path to website directory (e.g., `/home/u756585617/domains/breveasy.com/public_html`)

3. The workflow will automatically deploy on every push to `main`

### Manual Trigger:
You can also manually trigger deployment:
- Go to GitHub → Repository → Actions → "Deploy to Breveasy.com" → Run workflow

## Quick Test

Create a test commit to verify deployment:
```bash
# In localhost
echo "<!-- Deployment test $(date) -->" >> index.php
git add index.php
git commit -m "Test: Verify auto-deployment"
git push origin main
```

Then check breveasy.com to see if the change appears (check page source for the comment).

## Troubleshooting Checklist

- [ ] Git repository exists on breveasy.com
- [ ] Git remote points to correct GitHub repository
- [ ] Branch is set to `main` (not `master`)
- [ ] Hostinger Git Integration is enabled
- [ ] Webhook is configured and active (if using webhooks)
- [ ] Cron job exists and is running (if using cron)
- [ ] File permissions allow git operations
- [ ] SSH access works for manual deployment
- [ ] GitHub Actions secrets are configured (if using Actions)

## Next Steps

1. **Check Hostinger Control Panel** first - this is usually where the issue is
2. **Test manual pull** via SSH to verify git works
3. **Set up GitHub Actions** as a reliable alternative if Hostinger's integration isn't working
4. **Contact Hostinger Support** if Git Integration panel shows errors

