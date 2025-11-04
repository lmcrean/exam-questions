# Secure Workflow Configuration Example

## How to Use Cost-Critical Secret Overrides

This shows how to configure your workflows to use GitHub Secrets that **override** the project-config.yml file.

### Example Workflow with Secret Override

```yaml
name: Deploy API (Secure)

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Load config with SECRET OVERRIDES
      - name: Load Configuration
        id: config
        uses: ./.github/workflows/actions/load-config
        with:
          config-path: '.github/project-config.yml'
          # 🔒 SECURITY: These secrets override the config file
          cloud-run-max-instances-secret: ${{ secrets.CLOUD_RUN_MAX_INSTANCES }}
          cloud-run-memory-secret: ${{ secrets.CLOUD_RUN_MEMORY }}
          cloud-run-cpu-secret: ${{ secrets.CLOUD_RUN_CPU }}

      # Deploy using the overridden values
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy my-api \
            --max-instances ${{ steps.config.outputs.cloud-run-max-instances }} \
            --memory ${{ steps.config.outputs.cloud-run-memory }} \
            --cpu ${{ steps.config.outputs.cloud-run-cpu }}
```

## How the Protection Works

### Scenario: Attacker Changes Config File

**Attacker's Malicious PR:**
```yaml
# .github/project-config.yml
cloud_run:
  max_instances: 99999  # ⚠️ Trying to cause huge costs!
  memory: "16Gi"
  cpu: "8"
```

**What Actually Happens:**

1. **CODEOWNERS blocks merge** (First line of defense)
2. **If somehow approved**, workflow still runs with **GitHub Secrets values**:

```
🔒 Using MAX_INSTANCES from GitHub Secret: 3
🔒 Using MEMORY from GitHub Secret: 512Mi
🔒 Using CPU from GitHub Secret: 1
```

3. **Result**: Deploy uses `max_instances: 3` (from secret), NOT `99999` (from config)

### Why This is Secure

| What Can Attacker Change? | Protected By | Result |
|---------------------------|--------------|--------|
| `.github/project-config.yml` | CODEOWNERS + Secret Override | ❌ **Blocked** |
| GitHub Workflow `.yml` files | CODEOWNERS | ❌ **Blocked** |
| GitHub Secrets | Admin-only access | ❌ **Impossible** |
| GCP Direct | Service account permissions | ❌ **Blocked** |

**Bottom Line:** Even if attacker gets config file merged, **secrets win**.

## Setting Up Secrets

### 1. Go to Repository Settings
Settings → Secrets and variables → Actions → New repository secret

### 2. Add These Secrets

```
Name: CLOUD_RUN_MAX_INSTANCES
Value: 3

Name: CLOUD_RUN_MEMORY
Value: 512Mi

Name: CLOUD_RUN_CPU
Value: 1
```

### 3. Update All Deployment Workflows

Find all workflows that deploy to Cloud Run and add the secret inputs:

```yaml
- uses: ./.github/workflows/actions/load-config
  with:
    cloud-run-max-instances-secret: ${{ secrets.CLOUD_RUN_MAX_INSTANCES }}
    cloud-run-memory-secret: ${{ secrets.CLOUD_RUN_MEMORY }}
    cloud-run-cpu-secret: ${{ secrets.CLOUD_RUN_CPU }}
```

## Verification

### Check if Secrets are Being Used

Look for these lines in workflow logs:

```
✅ Good (Protected):
🔒 Using MAX_INSTANCES from GitHub Secret: 3

⚠️ Warning (Not Protected):
⚠️ Using MAX_INSTANCES from config file: 3 (Set CLOUD_RUN_MAX_INSTANCES secret for protection)
```

If you see the warning, **set the secret** immediately!

## Migration Checklist

- [ ] Set `CLOUD_RUN_MAX_INSTANCES` secret to `3`
- [ ] Set `CLOUD_RUN_MEMORY` secret to `512Mi`
- [ ] Set `CLOUD_RUN_CPU` secret to `1`
- [ ] Update all workflows to pass secrets to load-config action
- [ ] Test deployment and check logs for "🔒 Using ... from GitHub Secret"
- [ ] Enable branch protection with CODEOWNERS
- [ ] Document for your team

## Additional Protection

### Set GCP Quotas (Final Safety Net)

Even if everything fails, set hard GCP quotas:

```bash
# Set quota for Cloud Run
gcloud alpha resource-manager org-policies set-policy policy.yaml
```

policy.yaml:
```yaml
constraint: constraints/run.allowedIngress
listPolicy:
  allowedValues:
    - internal-and-cloud-load-balancing
constraint: constraints/compute.vmExternalIpAccess
listPolicy:
  deniedValues:
    - "*"
```

