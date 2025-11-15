# CI Workflow Test

This file verifies that the dual-trigger CI workflow is functioning correctly.

## Test Details

- **Branch**: `claude/ci-workflow-syntax-fix-01EHAPW1FqMWYhhZNPz9Sra8`
- **Expected Trigger**: `pull_request` (same-repo PR)
- **Expected Path**: `deploy-trusted` (auto-deploy, no environment protection)
- **Test Timestamp**: 2025-11-15

## Expected Behavior

When a PR exists for this branch:
1. CI should trigger automatically on commit
2. The `pull_request` event should fire (not `pull_request_target`)
3. The workflow should run FROM this branch (branch-specific CI)
4. lmcrean should be auto-authorized (repository collaborator)
5. Deployment should proceed without manual approval

## Verification

If this commit triggers the workflow, the CI is working correctly! ✅
