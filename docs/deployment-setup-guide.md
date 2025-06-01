# Azure Function Deployment Setup Guide

## Overview
This guide explains how to set up proper CI/CD deployment for the PokeData Azure Functions using GitHub Actions with RBAC authentication.

## Current Setup

### Workflow Files
- **`deploy-staging.yml`**: Automatically deploys to staging slot on pushes to `main` or `cloud-migration` branches
- **`deploy-production.yml`**: Manual deployment to production (supports slot swapping)
- **`azure-static-web-apps-orange-ocean-0579a9c10.yml`**: Frontend deployment (unchanged)

### Deployment Strategy
1. **Development** → Push to `main` or `cloud-migration` branch
2. **Staging** → Automatic deployment via GitHub Actions
3. **Testing** → Test functions at `https://pokedata-func-staging.azurewebsites.net`
4. **Production** → Manual slot swap via GitHub Actions

## Required GitHub Secrets

You need to configure these secrets in your GitHub repository:

### Service Principal Secrets
- `AZURE_CLIENT_ID`: The client ID of your Azure service principal
- `AZURE_TENANT_ID`: Your Azure tenant ID (`5f445a68-ec75-42cf-a50f-6ec158ee675c`)
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID (`555b4cfa-ad2e-4c71-9433-620a59cf7616`)

## Setup Steps

### Step 1: Create Service Principal (if not exists)
```bash
# Login to Azure
az login

# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-pokedata" \
  --role contributor \
  --scopes /subscriptions/555b4cfa-ad2e-4c71-9433-620a59cf7616/resourceGroups/pokedata-rg \
  --sdk-auth
```

This will output JSON like:
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "555b4cfa-ad2e-4c71-9433-620a59cf7616",
  "tenantId": "5f445a68-ec75-42cf-a50f-6ec158ee675c"
}
```

### Step 2: Configure GitHub Secrets
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add these repository secrets:
   - `AZURE_CLIENT_ID`: Use the `clientId` from the JSON output
   - `AZURE_TENANT_ID`: Use the `tenantId` from the JSON output  
   - `AZURE_SUBSCRIPTION_ID`: Use the `subscriptionId` from the JSON output

### Step 3: Grant Additional Permissions
The service principal needs access to both production and staging slots:

```bash
# Get the service principal object ID
SP_OBJECT_ID=$(az ad sp show --id "your-client-id" --query objectId -o tsv)

# Grant contributor access to the function app
az role assignment create \
  --assignee $SP_OBJECT_ID \
  --role "Contributor" \
  --scope "/subscriptions/555b4cfa-ad2e-4c71-9433-620a59cf7616/resourceGroups/pokedata-rg/providers/Microsoft.Web/sites/pokedata-func"

# Grant contributor access to the staging slot
az role assignment create \
  --assignee $SP_OBJECT_ID \
  --role "Contributor" \
  --scope "/subscriptions/555b4cfa-ad2e-4c71-9433-620a59cf7616/resourceGroups/pokedata-rg/providers/Microsoft.Web/sites/pokedata-func/slots/staging"
```

## Deployment Process

### Automatic Staging Deployment
1. Push code to `main` or `cloud-migration` branch
2. GitHub Actions automatically:
   - Builds the TypeScript code
   - Installs dependencies
   - Deploys to staging slot
3. Test at: `https://pokedata-func-staging.azurewebsites.net/api/GetSetList`

### Manual Production Deployment
1. Go to GitHub repository → Actions tab
2. Select "Deploy to Azure Functions Production" workflow
3. Click "Run workflow"
4. Choose deployment method:
   - **Swap** (recommended): Swaps staging slot to production
   - **Direct**: Builds and deploys directly to production

### Testing Endpoints
- **Staging**: `https://pokedata-func-staging.azurewebsites.net/api/`
- **Production**: `https://pokedata-func.azurewebsites.net/api/`

Available endpoints:
- `/GetSetList` - Get all Pokémon card sets
- `/GetCardsBySet?setCode=PRE` - Get cards for a specific set
- `/GetCardInfo?cardId=sv8pt5-161` - Get card information and pricing

## Troubleshooting

### Common Issues

1. **"Resource doesn't exist" error**
   - Verify service principal has correct permissions
   - Check that resource names match exactly
   - Ensure subscription ID is correct

2. **Authentication failures**
   - Verify all three secrets are set correctly
   - Check that service principal hasn't expired
   - Ensure tenant ID matches your Azure AD

3. **Build failures**
   - Check that `package.json` has correct build script
   - Verify TypeScript compilation succeeds locally
   - Check Node.js version compatibility

### Verification Commands
```bash
# Test service principal authentication
az login --service-principal \
  --username "your-client-id" \
  --password "your-client-secret" \
  --tenant "5f445a68-ec75-42cf-a50f-6ec158ee675c"

# List function apps to verify access
az functionapp list --resource-group pokedata-rg

# Check deployment slots
az functionapp deployment slot list \
  --name pokedata-func \
  --resource-group pokedata-rg
```

## Key Improvements

### From Old Setup
- ✅ **RBAC Authentication**: Modern, secure authentication instead of publish profiles
- ✅ **Proper Package Path**: Correctly points to `./PokeDataFunc` directory
- ✅ **Artifact-based Deployment**: Separates build and deploy for better reliability
- ✅ **Slot Management**: Proper staging-to-production workflow
- ✅ **Manual Production Control**: Production deployments require manual approval

### Security Benefits
- No publish profiles stored in secrets
- Service principal with minimal required permissions
- Audit trail for all deployments
- Ability to rotate credentials easily

## Next Steps

1. **Configure the GitHub secrets** as described above
2. **Test staging deployment** by pushing to main branch
3. **Verify staging endpoints** work correctly
4. **Test production deployment** using slot swap
5. **Monitor deployments** in GitHub Actions tab

## Support

If you encounter issues:
1. Check the GitHub Actions logs for detailed error messages
2. Verify Azure resource permissions in the Azure Portal
3. Test service principal authentication manually using Azure CLI
4. Review the troubleshooting section above
