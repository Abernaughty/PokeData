# GitHub Actions Workflow Fix Documentation

## Problem Summary

The GitHub Actions workflows were failing due to package manager conflicts:

1. **Static Web App Deployment**: npm trying to resolve pnpm's dependency tree (ERESOLVE conflict)
2. **Azure Functions Deployment**: Cache resolution issues with npm when project uses pnpm

## Root Cause

- **Frontend project** uses **pnpm** (as specified in `package.json`: `"packageManager": "pnpm@10.9.0"`)
- **Azure Functions project** uses **npm** (no pnpm configuration)
- **GitHub Actions workflows** were configured to use npm for both projects
- **Dependency resolution conflicts** occurred when npm tried to process pnpm's lock file

## Solution Implemented

### 1. Created Proper Workflow Files

Created two new workflow files in `.github/workflows/`:

#### A. `azure-static-web-apps.yml` - Frontend Deployment
- **Uses pnpm** for the frontend project
- **Proper pnpm setup** with version 10.9.0
- **pnpm caching** for faster builds
- **Custom build process** with `skip_app_build: true`

#### B. `azure-functions.yml` - Backend Deployment  
- **Uses npm** for the Azure Functions project
- **Staging-first deployment** with slot swapping
- **Manual production deployment** for safety

### 2. Key Workflow Features

#### Static Web Apps Workflow:
```yaml
# Setup pnpm
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10.9.0

# Setup Node.js with pnpm cache
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'pnpm'

# Install dependencies with pnpm
- name: Install dependencies
  run: pnpm install --frozen-lockfile

# Build the application
- name: Build application
  run: pnpm run build
```

#### Azure Functions Workflow:
```yaml
# Uses npm for Functions project
- name: 'Resolve Project Dependencies Using NPM'
  shell: bash
  run: |
    pushd './${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}'
    npm ci
    npm run build --if-present
    popd
```

## Required GitHub Secrets

The workflows require these secrets to be configured in your GitHub repository:

### Static Web Apps Secrets (OIDC + Deployment Token):
- `AZURE_STATIC_WEB_APPS_API_TOKEN_ORANGE_OCEAN_0579A9C10` (deployment token)

### Azure Functions Secrets (OIDC Only):
- `AZURE_CLIENT_ID` (service principal)
- `AZURE_CLIENT_SECRET` (service principal)  
- `AZURE_TENANT_ID` (service principal)
- `AZURE_SUBSCRIPTION_ID` (subscription)

## How to Configure Secrets

### 1. Static Web Apps API Token
1. Go to Azure Portal → Static Web Apps → Your app
2. Go to "Manage deployment token"
3. Copy the deployment token
4. In GitHub: Settings → Secrets and variables → Actions
5. Add secret: `AZURE_STATIC_WEB_APPS_API_TOKEN_POLITE_HILL_0E7F1F310`

### 2. Azure Functions Publish Profile
1. Go to Azure Portal → Function App → pokedata-func
2. Go to "Get publish profile" 
3. Download the publish profile
4. In GitHub: Add secret: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_STAGING`

### 3. Service Principal Credentials (for slot swapping)
1. Create service principal in Azure CLI:
   ```bash
   az ad sp create-for-rbac --name "github-actions-pokedata" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/pokemon-card-pricing
   ```
2. Add the returned values as GitHub secrets:
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `AZURE_TENANT_ID`

## Workflow Triggers

### Static Web Apps:
- **Push to main/cloud-migration branches**
- **Pull requests to main branch**

### Azure Functions:
- **Push to main/cloud-migration branches** (only when PokeDataFunc/ files change)
- **Manual trigger** via workflow_dispatch

## Deployment Flow

### Static Web Apps:
1. **Automatic** on push to main/cloud-migration
2. **Build with pnpm** → **Deploy to Azure Static Web Apps**

### Azure Functions:
1. **Build and deploy to staging** (automatic)
2. **Deploy to production** (automatic slot swap for main branch)

## Benefits of This Fix

1. **✅ Resolves ERESOLVE conflicts** - Uses correct package manager for each project
2. **✅ Faster builds** - Proper caching with pnpm for frontend
3. **✅ Safer deployments** - Staging-first with slot swapping for Functions
4. **✅ Consistent environments** - Same package manager locally and in CI/CD
5. **✅ Better error handling** - Separate workflows for different project types

## Testing the Fix

After pushing these workflow files and configuring secrets:

1. **Test Static Web Apps**: Push a change to the frontend code
2. **Test Azure Functions**: Push a change to PokeDataFunc/ directory
3. **Monitor workflows** in GitHub Actions tab
4. **Verify deployments** in Azure Portal

## Troubleshooting

### If Static Web Apps deployment fails:
- Check that `AZURE_STATIC_WEB_APPS_API_TOKEN_POLITE_HILL_0E7F1F310` secret is correct
- Verify pnpm version matches `package.json` specification
- Check build output in GitHub Actions logs

### If Azure Functions deployment fails:
- Verify `AZURE_FUNCTIONAPP_PUBLISH_PROFILE_STAGING` secret is correct
- Check that npm dependencies install correctly
- Verify TypeScript compilation succeeds

### If production slot swap fails:
- Check service principal credentials are correct
- Verify service principal has contributor access to resource group
- Check Azure CLI version compatibility

## Next Steps

1. **Push these workflow files** to your repository
2. **Configure all required secrets** in GitHub
3. **Test deployments** by making small changes
4. **Monitor first few deployments** to ensure everything works correctly
5. **Remove any old/conflicting workflow files** if they exist

The workflows are now properly configured to handle the package manager differences between your frontend (pnpm) and backend (npm) projects.
