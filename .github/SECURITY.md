# Security Configuration Guide

This document explains the multi-layer security approach for protecting cost-critical configuration values.

## 🔒 Multi-Layer Protection Strategy

### Layer 1: CODEOWNERS Protection
**File**: `.github/CODEOWNERS`

Requires repository owner approval for changes to:
- `.github/project-config.yml` - Deployment configuration
- `.github/workflows/*.yml` - CI/CD workflows
- `.env.example` - Environment template
- `/gcp-setup/*.sh` - Deployment scripts
- `/setup-project.sh` - Setup script

**To Enable:**
1. Go to: Settings → Branches → Branch protection rules
2. Add rule for `main` branch
3. Enable: "Require review from Code Owners"

### Layer 2: GitHub Secrets Override
**Recommended Secrets** (Set in: Settings → Secrets and variables → Actions)

#### Cost-Critical Overrides
```bash
# Cloud Run Limits (prevents cost attacks)
CLOUD_RUN_MAX_INSTANCES=3      # Maximum concurrent instances
CLOUD_RUN_MEMORY=512Mi         # Memory per instance
CLOUD_RUN_CPU=1                # CPU per instance

# Optional: Set budget alerts
GCP_MONTHLY_BUDGET=50          # USD per month
```

#### Project Configuration
```bash
# Required for deployment
GCP_SA_KEY                     # Service account JSON key
GCP_PROJECT_ID                 # GCP project ID
FIREBASE_SERVICE_ACCOUNT_KEY   # Firebase service account JSON
FIREBASE_PROJECT_ID            # Firebase project ID
APP_NAME                       # Application name
APP_DISPLAY_NAME               # Display name
```

### Layer 3: Workflow Secret Usage

Your GitHub Actions workflows should prefer secrets over config file:

```yaml
# Example workflow snippet
- name: Deploy to Cloud Run
  run: |
    gcloud run deploy ${{ secrets.APP_NAME }}-api \
      --max-instances ${{ secrets.CLOUD_RUN_MAX_INSTANCES || 3 }} \
      --memory ${{ secrets.CLOUD_RUN_MEMORY || '512Mi' }} \
      --cpu ${{ secrets.CLOUD_RUN_CPU || '1' }}
```

**Priority**: Secret → Config File → Hardcoded Default

## 🛡️ Protection from Attackers

### Attack Vector: Malicious PR
**Scenario**: Attacker creates PR changing `max_instances: 3` → `max_instances: 3242432`

**What happens step by step:**

1. **Attacker submits malicious PR:**
   ```yaml
   # .github/project-config.yml
   cloud_run:
     max_instances: 3242432  # ⚠️ Malicious change!
   ```

2. **CODEOWNERS blocks merge** (First defense layer)
   - PR requires approval from repository owner
   - Visible in PR: "Review required from code owners"

3. **If somehow approved** (social engineering, compromised account):
   - Workflow runs with **GitHub Secrets override**
   - Load-config action outputs:
     ```
     🔒 Using MAX_INSTANCES from GitHub Secret: 3
     ✅ Deployment uses 3 (NOT 3242432!)
     ```

4. **Result**: Deploy uses `max_instances: 3` from secret, ignoring config file

**Protections:**
1. ✅ **CODEOWNERS blocks merge** - Requires owner approval
2. ✅ **GitHub Secrets override** - **Even if config says 3242432, secret enforces 3**
3. ✅ **GCP quota limits** - Final safety net if both fail

### Attack Vector: Compromised Contributor Account
**Scenario**: Contributor account is compromised

**Protections:**
1. ✅ **Branch protection** - Cannot push directly to main
2. ✅ **Required reviews** - PR needs approval from CODEOWNER
3. ✅ **GitHub Secrets** - Only repository admins can modify secrets
4. ✅ **2FA required** - Organization-level policy (recommended)

### Attack Vector: Social Engineering
**Scenario**: Attacker convinces someone to approve malicious changes

**Protections:**
1. ✅ **Audit trail** - All changes logged in git history
2. ✅ **Secret override** - Even if config changes, secrets win
3. ✅ **GCP billing alerts** - Notifications if costs spike
4. ✅ **Review workflows** - Require multiple approvals for critical files

## 📋 Setup Checklist

### Enable Protection (One-Time Setup)

- [ ] **Step 1**: Update `.github/CODEOWNERS`
  ```bash
  # Replace @OWNER_USERNAME with your GitHub username
  sed -i 's/@OWNER_USERNAME/@your-username/g' .github/CODEOWNERS
  ```

- [ ] **Step 2**: Enable branch protection
  1. Go to: Settings → Branches
  2. Add rule for `main` branch
  3. Enable:
     - [x] Require pull request reviews before merging
     - [x] Require review from Code Owners
     - [x] Require status checks to pass
     - [x] Require conversation resolution before merging

- [ ] **Step 3**: Set GitHub Secrets
  1. Go to: Settings → Secrets and variables → Actions
  2. Add cost-critical secrets:
     - `CLOUD_RUN_MAX_INSTANCES`
     - `CLOUD_RUN_MEMORY`
     - `CLOUD_RUN_CPU`
  3. Add deployment secrets (required):
     - `GCP_SA_KEY`
     - `GCP_PROJECT_ID`
     - `FIREBASE_SERVICE_ACCOUNT_KEY`
     - etc.

- [ ] **Step 4**: Set up GCP billing alerts
  1. GCP Console → Billing → Budgets & alerts
  2. Create budget: $50/month (or your limit)
  3. Set alerts at: 50%, 90%, 100%

- [ ] **Step 5**: Enable 2FA (Recommended)
  1. Organization settings → Authentication security
  2. Require two-factor authentication

### For Each New Repository Clone

- [ ] Update `.github/CODEOWNERS` with owner username
- [ ] Enable branch protection rules
- [ ] Set all required GitHub Secrets
- [ ] Configure GCP billing alerts
- [ ] Review and approve any changes to cost-critical files

## 🚨 What to Do if Attacked

### If You Notice Suspicious Changes

1. **Immediate Actions:**
   ```bash
   # Revert malicious commit
   git revert <commit-hash>
   git push origin main

   # Or reset to known good state
   git reset --hard <good-commit-hash>
   git push --force origin main
   ```

2. **Check for Active Deployments:**
   ```bash
   # List running services
   gcloud run services list

   # Delete suspicious services
   gcloud run services delete suspicious-service --region=us-central1
   ```

3. **Verify GitHub Secrets:**
   - Check Settings → Secrets for unauthorized modifications
   - Rotate all secrets if compromised

4. **Check GCP Costs:**
   - GCP Console → Billing → Reports
   - Look for cost spikes
   - Disable billing if needed (emergency)

### Emergency: Stop All Cloud Run Services

```bash
# List all services
gcloud run services list

# Delete specific service
gcloud run services delete SERVICE_NAME --region REGION

# Or use emergency script
./gcp-setup/emergency-stop-services.ps1
```

## 📊 Monitoring & Alerts

### Recommended Alerts

1. **GCP Billing Alerts** (Cloud Console)
   - Budget: $50/month
   - Thresholds: 50%, 90%, 100%

2. **GitHub Actions Monitoring**
   - Watch for failed deployments
   - Review workflow run logs

3. **Cloud Run Metrics** (Cloud Console)
   - Instance count
   - Request rate
   - Error rate

### Regular Reviews

- **Weekly**: Check GCP billing dashboard
- **Monthly**: Review access logs and permissions
- **Quarterly**: Audit all GitHub secrets and CODEOWNERS

## 📚 Additional Resources

- [GitHub CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GCP Cost Management](https://cloud.google.com/cost-management)

## 🔐 Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets or Secret Manager
2. **Enable 2FA** - For all contributors
3. **Limit admin access** - Only give to trusted individuals
4. **Regular audits** - Review permissions quarterly
5. **Principle of least privilege** - Only grant necessary permissions
6. **Monitor costs** - Set up alerts before limits are hit
