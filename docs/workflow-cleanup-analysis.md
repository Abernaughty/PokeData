# GitHub Workflows Analysis and Cleanup Recommendations

## Current Workflow Files Analysis

### 1. ❌ **main_test-poke-func.yml** (DELETE)
**Purpose**: Old Azure Functions deployment  
**Issues**:
- Deploys to wrong function name (`test-poke-func` instead of `pokedata-func`)
- Deploys directly to production without staging
- Uses npm instead of pnpm
- No health checks or validation
- Will conflict with other workflows

**Recommendation**: **DELETE** - This is obsolete and incorrect

---

### 2. ⚠️ **azure-functions.yml** (DELETE OR DISABLE)
**Purpose**: Azure Functions deployment with staging  
**Good Features**:
- Uses correct function name (`pokedata-func`)
- Deploys to staging first
- Uses pnpm (correct package manager)
- Has path filters to only trigger on relevant changes
- Automatically swaps to production (no manual gate)

**Issues**:
- Automatically swaps to production without approval
- Conflicts with the new `deploy-function.yml`
- Both will trigger on push to main

**Recommendation**: **DELETE** - Conflicts with new workflow, lacks manual approval

---

### 3. ✅ **deploy-function.yml** (KEEP - PRIMARY)
**Purpose**: New improved CI/CD pipeline  
**Features**:
- Manual approval gate for production
- Health checks at each stage
- PR validation without deployment
- Proper staging → production flow
- Uses correct function name (`pokedata-func`)
- Clear status messages and emojis

**Recommendation**: **KEEP** - This is your primary deployment workflow

---

### 4. ✅ **azure-static-web-apps-calm-mud-07a7f7a10.yml** (KEEP)
**Purpose**: Frontend deployment to Azure Static Web Apps  
**Features**:
- Deploys frontend only
- Has path filters for frontend files
- Handles PR previews
- Separate from backend deployment

**Recommendation**: **KEEP** - Essential for frontend deployment

---

## Conflict Analysis

### Critical Conflicts:
1. **Three workflows deploy Azure Functions**:
   - `main_test-poke-func.yml` (wrong function name)
   - `azure-functions.yml` (auto-swap to production)
   - `deploy-function.yml` (manual approval - desired)

2. **Multiple triggers on push to main**:
   - All three function workflows trigger on main push
   - This causes duplicate deployments
   - Wastes GitHub Actions minutes
   - Creates confusion about which deployment is active

---

## Recommended Actions

### Immediate Actions:

1. **DELETE `main_test-poke-func.yml`**
   - Wrong function name
   - Obsolete approach
   - No staging environment

2. **DELETE `azure-functions.yml`**
   - Conflicts with new workflow
   - Auto-swaps without approval (risky)
   - Same functionality covered by `deploy-function.yml`

3. **KEEP `deploy-function.yml`**
   - Your primary backend deployment
   - Has manual approval gates
   - Follows best practices

4. **KEEP `azure-static-web-apps-calm-mud-07a7f7a10.yml`**
   - Frontend deployment
   - No conflicts with backend

### Optional Improvements:

1. **Consider renaming for clarity**:
   - `deploy-function.yml` → `backend-deployment.yml`
   - Makes it clear this is for backend/functions

2. **Add path filters to deploy-function.yml** (from azure-functions.yml):
   ```yaml
   on:
     push:
       branches: [main]
       paths:
         - 'PokeDataFunc/**'
         - '.github/workflows/deploy-function.yml'
   ```
   This prevents unnecessary deployments when only frontend changes.

---

## Final State After Cleanup

You should have only 2 workflow files:
1. **`deploy-function.yml`** (or renamed to `backend-deployment.yml`)
   - Backend/Azure Functions deployment
   - Staging → Manual Approval → Production

2. **`azure-static-web-apps-calm-mud-07a7f7a10.yml`**
   - Frontend deployment
   - Static Web App

This gives you:
- ✅ No conflicts or duplicate deployments
- ✅ Clear separation of frontend/backend
- ✅ Safe deployment with manual approval
- ✅ Efficient use of GitHub Actions minutes
