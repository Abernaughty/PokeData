# CI/CD Deployment Guide for PokeData Functions

This guide explains the improved CI/CD deployment pipeline for the PokeData Azure Functions, which follows industry best practices for safe, staged deployments.

## Overview

The new deployment pipeline implements:
- **Staging Environment**: All deployments go to staging first for testing
- **Health Checks**: Automated verification of deployments
- **Manual Approval Gates**: Production deployments require explicit approval
- **Easy Rollback**: Previous version remains in staging slot for quick rollback
- **Multiple Deployment Methods**: GitHub Actions for automation, local scripts for manual control

## Architecture

```
Developer Push → Build/Test → Deploy to Staging → Test → Approve → Swap to Production
                                     ↓
                              (staging slot)
                         pokedata-func-staging
                                     ↓
                              Manual Testing
                                     ↓
                              Approval Gate
                                     ↓
                               Slot Swap
                                     ↓
                              (production)
                            pokedata-func
```

## Deployment Methods

### 1. GitHub Actions (Automated)

**Workflow**: `.github/workflows/deploy-function.yml`

#### Triggers
- **Push to main**: Automatically deploys to staging, requires approval for production
- **Pull Request**: Runs build and tests only (no deployment)
- **Manual**: Can be triggered manually from GitHub Actions tab

#### Process
1. **Build & Test**: Compiles TypeScript, runs tests
2. **Deploy to Staging**: Automatically deploys to staging slot
3. **Health Check**: Verifies staging deployment is working
4. **Manual Approval**: Waits for approval in GitHub
5. **Swap to Production**: After approval, swaps staging to production
6. **Verification**: Confirms production is healthy

#### Setup Required
1. Go to your GitHub repository Settings → Environments
2. Create a `production` environment
3. Add protection rules:
   - Required reviewers (add yourself)
   - Optional: Add a wait timer for extra safety

### 2. Local Deployment Script (Manual)

**Script**: `PokeDataFunc/deploy.bat`

#### Options

**Option 1: Safe Deploy (Recommended)**
- Builds and deploys to staging slot
- Runs health checks
- Offers choice to test manually or swap immediately
- Single execution for complete pipeline

**Option 2: Emergency Direct to Production**
- Bypasses staging (use with caution)
- Direct deployment to production
- For critical hotfixes only

**Option 3: Swap Staging to Production**
- Swaps an existing staging deployment
- Use when you've already tested staging

#### Usage
```batch
cd PokeDataFunc
deploy.bat

# Choose option 1 for safe deployment
# Test at: https://pokedata-func-staging.azurewebsites.net
# Then choose to swap when ready
```

## URLs

### Production
- Base: `https://pokedata-func.azurewebsites.net`
- Endpoints:
  - `/api/GetSetList`
  - `/api/GetCardsBySet?setCode={code}`
  - `/api/GetCardInfo?cardId={id}`

### Staging
- Base: `https://pokedata-func-staging.azurewebsites.net`
- Same endpoints as production for testing

## Testing Process

### Automated Testing
1. **Build Verification**: TypeScript compilation must succeed
2. **Unit Tests**: Run during build phase (if present)
3. **Health Checks**: HTTP status verification after deployment

### Manual Testing
After staging deployment:
1. Test GetSetList: `https://pokedata-func-staging.azurewebsites.net/api/GetSetList`
2. Test GetCardsBySet: `https://pokedata-func-staging.azurewebsites.net/api/GetCardsBySet?setCode=sv8pt5`
3. Test GetCardInfo: `https://pokedata-func-staging.azurewebsites.net/api/GetCardInfo?cardId=sv8pt5-161`
4. Verify response data and performance

## Rollback Procedures

### Quick Rollback (Slot Swap)
If issues are discovered after production deployment:

**Via Azure CLI:**
```bash
az functionapp deployment slot swap \
  --name pokedata-func \
  --resource-group pokedata-rg \
  --slot staging \
  --target-slot production
```

**Via deploy.bat:**
```batch
deploy.bat
# Choose option 3: Swap Staging to Production
```

**Via Azure Portal:**
1. Navigate to your Function App
2. Go to Deployment slots
3. Click "Swap"
4. Confirm the swap

### Git Revert
For code-level issues:
```bash
git revert HEAD
git push origin main
# This triggers new deployment through CI/CD
```

## Best Practices

### Do's
- ✅ Always deploy to staging first
- ✅ Test staging thoroughly before swapping
- ✅ Use health checks to verify deployments
- ✅ Keep the previous version in staging for rollback
- ✅ Document any configuration changes
- ✅ Monitor logs after deployment

### Don'ts
- ❌ Don't skip staging unless it's a critical emergency
- ❌ Don't approve production without testing staging
- ❌ Don't ignore health check failures
- ❌ Don't deploy during peak usage times
- ❌ Don't forget to warm up production after swap

## Monitoring

### Health Endpoints
Monitor these endpoints for availability:
- `/api/GetSetList` - Basic health check
- `/api/GetCardsBySet?setCode=sv8pt5` - Data retrieval test
- `/api/GetCardInfo?cardId=sv8pt5-161` - Specific card test

### Logs
View logs in Azure Portal:
1. Navigate to your Function App
2. Go to "Log stream" or "Application Insights"
3. Monitor for errors or warnings

### Metrics to Watch
- Response time
- Error rate
- Request count
- Memory usage
- Cold start frequency

## Troubleshooting

### Common Issues

**Staging deployment works but production swap fails:**
- Check if production slot has different configuration
- Verify all required app settings are present
- Ensure connection strings are correct

**Health checks fail after deployment:**
- Wait 30-60 seconds for app to warm up
- Check if all dependencies are included
- Verify environment variables are set

**Rollback doesn't restore functionality:**
- Check if the issue is data-related (not code)
- Verify external dependencies are available
- Review configuration changes

## Configuration Management

### Environment Variables
Ensure these are set in both slots:
- `COSMOSDB_CONNECTION_STRING`
- `BLOB_STORAGE_CONNECTION_STRING`
- `REDIS_CONNECTION_STRING`
- `POKEMON_TCG_API_KEY`
- `POKEDATA_API_KEY`

### Slot-Specific Settings
Mark settings as "deployment slot settings" if they should differ:
- Connection strings for test vs production databases
- API keys for different environments
- Feature flags for testing

## Summary

This CI/CD pipeline provides:
1. **Safety**: No direct production deployments
2. **Testing**: Staging environment for validation
3. **Control**: Manual approval gates
4. **Flexibility**: Multiple deployment methods
5. **Recovery**: Easy rollback options

By following this guide, you can deploy with confidence knowing that:
- Code is tested before reaching production
- You have time to validate changes
- Rollback is quick if issues arise
- The deployment process is consistent and reliable
