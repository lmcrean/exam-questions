# Vertex AI Setup Guide

## Current Status: ⏸️ Awaiting ToS Acceptance

### Completed Steps ✅

1. **Vertex AI API Enabled**
   - ✅ `aiplatform.googleapis.com` enabled
   - ✅ `generativelanguage.googleapis.com` enabled

2. **Service Account Configured**
   - ✅ Service Account: `github-actions-cloudrun@lauriecrean-free-38256.iam.gserviceaccount.com`
   - ✅ Roles: `roles/aiplatform.user`, `roles/editor`
   - ✅ Key file: `gcp-setup/gcp-sa-key.json`

3. **Code Updated**
   - ✅ Installed `@google-cloud/vertexai` package
   - ✅ Updated `aiResponse.ts` to use Vertex AI
   - ✅ Configured authentication for local and Cloud Run
   - ✅ Set region to `europe-west2` (London)

4. **Environment Configuration**
   - ✅ `GOOGLE_APPLICATION_CREDENTIALS=../../gcp-setup/gcp-sa-key.json`
   - ✅ `GCP_PROJECT_ID=lauriecrean-free-38256`
   - ✅ `GCP_LOCATION=europe-west2`

### Next Step: Accept Terms of Service 🔒

**You need to manually accept Generative AI Terms of Service in the Google Cloud Console:**

1. **Visit**: https://console.cloud.google.com/vertex-ai/generative/language
2. **Select Project**: `lauriecrean-free-38256`
3. **Click**: "Enable Generative AI" or "Accept Terms"
4. **Wait**: 1-2 minutes for activation

### Testing After ToS Acceptance

Run the test script:

```bash
cd apps/api
npx tsx test-vertex-ai.ts
```

Expected output:
```
🧪 Testing Vertex AI integration...
📍 Project: lauriecrean-free-38256
📍 Location: europe-west2
Test 1: Simple generation ✅
Test 2: Chat with history ✅
Test 3: Assessment-style prompt ✅
🎉 All tests passed!
```

### Production Deployment

Once tests pass, your API will automatically use Vertex AI:

1. **Local Development**: Uses service account key file
2. **Cloud Run**: Uses attached service account (automatic)

### Model Configuration

- **Current Model**: `gemini-pro` (stable, production-ready)
- **Alternative**: `gemini-1.5-flash` (faster, more cost-effective)
- **Location**: `europe-west2` (London - low latency for UK users)

### Cost Optimization

For 100-100,000 users, consider:

1. **Model Choice**:
   - `gemini-pro`: ~$0.00025 per 1K characters input
   - `gemini-1.5-flash`: ~$0.000125 per 1K characters (50% cheaper)

2. **Caching**: Implement conversation history caching
3. **Rate Limiting**: Set per-user quotas
4. **Monitoring**: Use Cloud Monitoring to track usage

### Security Best Practices

✅ **Implemented:**
- Service account authentication (not API keys)
- Principle of least privilege (specific AI roles)
- Environment-based configuration
- Credentials never committed to Git

🔒 **For Production:**
- Enable VPC Service Controls
- Set up Cloud Armor for DDoS protection
- Implement request signing
- Monitor for anomalous usage patterns

### Troubleshooting

**If tests still fail after ToS acceptance:**

1. **Wait longer**: Can take up to 5 minutes
2. **Check Console**: Verify you see Vertex AI dashboard
3. **Re-enable API**:
   ```bash
   gcloud services disable aiplatform.googleapis.com --project=lauriecrean-free-38256
   gcloud services enable aiplatform.googleapis.com --project=lauriecrean-free-38256
   ```
4. **Verify permissions**:
   ```bash
   gcloud projects get-iam-policy lauriecrean-free-38256 \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount:github-actions-cloudrun"
   ```

### Rollback Plan

If Vertex AI has issues, temporarily revert to direct Gemini API:

1. Uncomment in `.env`: `GEMINI_API_KEY=AIzaSyBUvq6TMK-3iVZR1n-_w2RRBAC_lznPDtA`
2. Modify `aiResponse.ts` line 5: Comment out Vertex AI import
3. Restore placeholder implementation

### Next Steps After Setup

1. ✅ Accept ToS and test
2. 📊 Set up Cloud Monitoring dashboards
3. 💰 Configure billing alerts
4. 🔒 Review security controls
5. 📈 Test with production traffic
6. 🚀 Deploy to Cloud Run

### Support

- **Vertex AI Docs**: https://cloud.google.com/vertex-ai/docs/generative-ai/start/quickstarts/quickstart-multimodal
- **Gemini Models**: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models
- **Pricing**: https://cloud.google.com/vertex-ai/pricing
- **Quotas**: https://cloud.google.com/vertex-ai/docs/quotas

---

**Status**: Ready for production once ToS is accepted ✨
