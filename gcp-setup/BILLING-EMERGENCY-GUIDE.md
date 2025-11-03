# GCP Billing Emergency Guide

## CRITICAL ISSUE: SERVICES RUNNING 24/7

Your current billing shows **£18.04** in charges. The root cause has been identified:

### CRITICAL PROBLEM: minScale=1 on ALL Services
- **All 10 services have `minScale: 1`** - meaning they run 24/7 even with ZERO traffic
- Each service costs ~£0.18/day when always-on
- **10 services × £0.18/day = £1.80/day = £54/month**
- Your £18.04 charge = approximately 10 days of this waste

### Secondary Problem: Too Many Services
- **10 Cloud Run services** active in dottie-app-37930
- Many are old branch deployments (issue-416, issue-418, claude-fix-issue-424, etc.)
- Only 2 services needed: `api-main` and `dottie-api-main`
- **8 unnecessary services** multiplying the cost

### Cost Breakdown
- 10 services × minScale=1 × £0.18/day = **£54/month**
- With minScale=0: 10 services × £0.02/day = **£6/month** (90% savings)
- With 2 services + minScale=0: 2 services × £0.02/day = **£1.20/month** (98% savings)

---

## IMMEDIATE ACTIONS (Do This Now)

### 1. EMERGENCY: Stop Always-On Services (2 minutes) 🔥

**THIS IS THE MOST IMPORTANT STEP!**

Run this PowerShell script:
```powershell
.\gcp-setup\emergency-stop-services.ps1
```

This will:
- Set all services from `minScale=1` to `minScale=0`
- Stop services from running 24/7 when idle
- **Reduce costs by 80-90% immediately**
- Services still start automatically when receiving requests (1-2 second cold start)

**Effect:** Cuts your daily cost from £1.80 to £0.20-£0.30

### 2. Set Up Budget Alerts (5 minutes)

Run this PowerShell script:
```powershell
.\gcp-setup\setup-billing-limits.ps1
```

This will:
- Create a £5/month budget
- Set alerts at 50%, 75%, 90%, and 100%
- Configure minimum resources for Cloud Run
- Generate a cleanup script

### 2. Configure Email Notifications (2 minutes)

**CRITICAL**: You won't receive alerts without this!

1. Go to: https://console.cloud.google.com/monitoring/alerting/notifications?project=dottie-app-37930
2. Click **"Create Channel"**
3. Select **"Email"**
4. Enter your email: `lmcrean@gmail.com`
5. Verify the email
6. Click **"Save"**

### 3. Delete Old Services (10 minutes)

Run the cleanup script:
```powershell
.\gcp-setup\cleanup-old-services.ps1
```

This will **delete 8 old services** and keep only:
- `api-main` (production)
- `dottie-api-main` (production backup)

**Expected savings:** From 10 services to 2 services = additional £6-8/month savings

### 4. Configure Email Notifications (2 minutes)

**CRITICAL**: You won't receive alerts without this!

1. Go to: https://console.cloud.google.com/monitoring/alerting/notifications?project=dottie-app-37930
2. Click **"Create Channel"**
3. Select **"Email"**
4. Enter your email: `lmcrean@gmail.com`
5. Verify the email
6. Click **"Save"**

---

## DETAILED SERVICE AUDIT

### Services to DELETE (Costing £1-3 each/month)
- ❌ `api-claude-fix-issue-424-011cudgexub7ema5tndmve7k`
- ❌ `api-claude-session-011cuajt7574mtwsmvoubyc2`
- ❌ `api-gh-actions`
- ❌ `api-issue-416-transparemt-icons`
- ❌ `api-issue-418-a-improved-icons`
- ❌ `api-ts-new`
- ❌ `dottie-api` (europe-west2 - duplicate)
- ❌ `dottie-api` (us-central1 - different region)

### Services to KEEP (Essential)
- ✅ `api-main` (europe-west2) - Production API
- ✅ `dottie-api-main` (europe-west2) - Production backup

---

## COST PREVENTION STRATEGIES

### 1. Automated Branch Cleanup

Update your GitHub Actions workflow to **automatically delete** Cloud Run services when PRs are closed.

Add to `.github/workflows/deploy-branch-preview.yml`:

```yaml
cleanup-on-pr-close:
  if: github.event.action == 'closed'
  runs-on: ubuntu-latest
  steps:
    - name: Delete Cloud Run Service
      run: |
        SERVICE_NAME="api-${{ github.head_ref }}"
        gcloud run services delete $SERVICE_NAME \
          --region=europe-west2 \
          --project=dottie-app-37930 \
          --quiet || echo "Service already deleted"
```

### 2. Set Resource Limits

Ensure all Cloud Run services use minimum resources:

```yaml
# In your deployment scripts
--min-instances=0          # Scale to zero when idle
--max-instances=1          # Limit concurrent instances
--cpu=1                    # Minimum CPU
--memory=512Mi             # Minimum memory
--concurrency=80           # Max requests per instance
--timeout=60s              # Request timeout
```

### 3. Enable Allways-Free Resources

Your project should use Cloud Run's free tier:
- **2 million requests/month FREE**
- **360,000 GB-seconds/month FREE**
- **180,000 vCPU-seconds/month FREE**

As long as you stay within these limits, you pay **£0**.

---

## MONITORING YOUR COSTS

### Daily Cost Check
```bash
gcloud billing accounts list
```

### View Detailed Billing
https://console.cloud.google.com/billing/012718-1BB7C0-9493DB/reports?project=dottie-app-37930

### Check Active Services
```bash
gcloud run services list --project=dottie-app-37930
```

### Set Budget Alerts
- 50% (£2.50) - Warning
- 75% (£3.75) - Review usage
- 90% (£4.50) - Stop deployments
- 100% (£5.00) - Emergency cleanup

---

## EMERGENCY PROCEDURES

### If Costs Exceed Budget

1. **Immediately delete all non-essential services:**
   ```bash
   gcloud run services list --project=dottie-app-37930 | grep "api-" | awk '{print $1}' | xargs -I {} gcloud run services delete {} --region=europe-west2 --quiet
   ```

2. **Scale production to zero:**
   ```bash
   gcloud run services update api-main --region=europe-west2 --min-instances=0 --max-instances=0
   ```

3. **Review billing:**
   https://console.cloud.google.com/billing/012718-1BB7C0-9493DB/reports

4. **Contact Google Support:**
   - Request a billing review
   - Ask for credits if charges are unexpected

---

## LONG-TERM COST OPTIMIZATION

### 1. Use Firebase Hosting for Frontend (FREE)
- 10 GB storage FREE
- 360 MB/day download FREE
- No charges for static site

### 2. Optimize Cloud Run
- Keep only 1-2 production services
- Delete branch deployments immediately after PR merge
- Use `--min-instances=0` to scale to zero

### 3. Use Cloud Run Free Tier
- Stay under 2 million requests/month
- Optimize response times
- Cache static content

### 4. Alternative: Use Vercel (FREE)
- Consider moving API to Vercel Edge Functions
- 100 GB bandwidth FREE
- Unlimited requests on Hobby plan

---

## BUDGET TARGETS

| Service | Current Cost | Target Cost | Savings |
|---------|-------------|-------------|---------|
| Cloud Run (10 services) | £15-20 | £0-2 | £13-18 |
| Firebase Hosting | £0 | £0 | £0 |
| Cloud Build | £0-3 | £0 | £0-3 |
| **Total** | **£18** | **£2** | **£16** |

**Goal: Reduce monthly costs from £18 to under £2**

---

## VERIFICATION CHECKLIST

After running the setup script, verify:

- [ ] Budget created (£5/month limit)
- [ ] Email notifications configured
- [ ] 8 old services deleted
- [ ] Only 2 services remaining (api-main, dottie-api-main)
- [ ] Cloud Run services set to min-instances=0
- [ ] Daily cost monitoring enabled
- [ ] GitHub Actions updated to auto-delete services

---

## QUESTIONS?

Check your current status:
```powershell
# Current project
gcloud config get-value project

# Active services
gcloud run services list --project=dottie-app-37930

# Billing info
gcloud billing projects describe dottie-app-37930

# Budget alerts
gcloud billing budgets list --billing-account=012718-1BB7C0-9493DB
```

---

## Summary

**Current State:**
- 10 Cloud Run services running
- £18.04/month in charges
- No budget alerts configured

**Target State:**
- 2 Cloud Run services (api-main, dottie-api-main)
- £0-2/month in charges (free tier)
- Budget alerts at £5/month
- Auto-cleanup on PR close

**Expected Savings: £16-18/month (89% reduction)**
