# PokeData Complete Deployment Guide

This guide provides clear instructions for deploying all components of the PokeData application, distinguishing between local development and production deployment methods.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Script Usage Guide](#script-usage-guide)
5. [Deployment Verification](#deployment-verification)

## 🏗️ Architecture Overview

The PokeData application consists of three main components:

| Component | Technology | Deployment Target | Deployment Method |
|-----------|------------|-------------------|-------------------|
| **Frontend** | Svelte SPA | Azure Static Web Apps | GitHub Actions (CI/CD) |
| **Backend API** | Azure Functions (TypeScript) | Azure Function App | GitHub Actions (CI/CD) |
| **Database** | CosmosDB | Azure (already deployed) | N/A - Managed Service |
| **Cache** | Redis | Azure Cache for Redis | N/A - Managed Service |

## 🖥️ Local Development Setup

### Prerequisites

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **Azure Functions Core Tools** (for backend)
4. **Git** for version control

### Frontend (Local)

```bash
# Install dependencies
pnpm install

# Run development server
npm run dev
# OR
pnpm dev

# Access at http://localhost:5000
```

**Local Development Scripts:**
- `server.bat` - Starts local dev server (Windows)
- `npm run dev` - Cross-platform dev server
- `npm run build` - Build for production (creates public/build/)

### Backend API (Local)

```bash
cd PokeDataFunc

# Install dependencies
pnpm install

# Build TypeScript
npm run build

# Start Functions locally
npm start
# OR
func start

# Access at http://localhost:7071/api/
```

**Local Development Scripts:**
- `npm run build:watch` - Watch mode for TypeScript
- `npm start` - Start Functions runtime
- `test-api.js` - Test API endpoints locally

### Utility Scripts (Local Only)

These scripts in `PokeDataFunc/scripts/` are for **LOCAL USE ONLY**:

```bash
# Data Management (requires .env with COSMOS_DB_CONNECTION_STRING)
node scripts/set-mapping.js --generate --manual    # Generate set mappings
node scripts/manage-image-urls.js --all            # Update image URLs in DB
node scripts/test-image-urls.js --verify           # Verify optimizations

# These modify production database but run locally!
```

## 🚀 Production Deployment

### Deployment Methods by Component

#### 1. Frontend Deployment

**Primary Method: GitHub Actions (Automated CI/CD) ✅**

The frontend automatically deploys when you push to the main branch:

```yaml
# .github/workflows/azure-static-web-apps-calm-mud-07a7f7a10.yml
# Triggers on:
- Push to main branch
- Pull request to main branch
```

**Manual Deployment (Backup Method):**

```bash
# Build locally
npm run build

# Deploy using SWA CLI
npx @azure/static-web-apps-cli deploy ./public \
  --deployment-token <your-token> \
  --env production

# OR use the deploy script
node deploy-frontend.js
```

#### 2. Backend API Deployment

**Primary Method: GitHub Actions (Automated CI/CD) ✅**

The backend automatically deploys when you push to the main branch:

```yaml
# .github/workflows/deploy-function.yml
# Triggers on:
- Push to main branch (changes in PokeDataFunc/)
```

**Manual Deployment (Backup Method):**

```bash
cd PokeDataFunc

# Build the project
npm run build

# Deploy using Azure Functions Core Tools
func azure functionapp publish pokedatafunc

# OR use the deploy script (Windows)
deploy.bat
```

#### 3. Database & Cache

These are **managed Azure services** - no deployment needed:
- **CosmosDB**: Managed through Azure Portal
- **Redis Cache**: Managed through Azure Portal

Data updates are done through:
1. The deployed Azure Functions (RefreshData endpoint)
2. Local scripts that connect to production DB (use with caution)

### Environment Configuration

#### Production Environment Variables

**Frontend (Static Web App):**
- Configured in Azure Portal > Static Web Apps > Configuration
- No .env file needed in production

**Backend (Function App):**
```
# Set in Azure Portal > Function App > Configuration
COSMOS_DB_CONNECTION_STRING=<connection-string>
REDIS_CONNECTION_STRING=<connection-string>
POKEDATA_API_KEY=<api-key>
POKEMON_TCG_API_KEY=<api-key>
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
```

## 📝 Script Usage Guide

### Development vs Production Scripts

| Script/File | Environment | Purpose | When to Use |
|------------|-------------|---------|-------------|
| **Frontend Scripts** |
| `server.bat` | Local | Start dev server | During development |
| `npm run dev` | Local | Start dev server | During development |
| `npm run build` | Local | Build for production | Before manual deploy |
| `deploy-frontend.js` | Local→Prod | Manual deployment | Emergency deployments |
| **Backend Scripts** |
| `PokeDataFunc/deploy.bat` | Local→Prod | Manual deployment | Emergency deployments |
| `PokeDataFunc/test-api.js` | Local | Test API endpoints | During development |
| **Data Management Scripts** |
| `scripts/set-mapping.js` | Local→Prod DB | Generate mappings | When adding new sets |
| `scripts/manage-image-urls.js` | Local→Prod DB | Update image URLs | Performance optimization |
| `scripts/test-image-urls.js` | Local | Test URL patterns | Before running updates |

### ⚠️ Important Notes on Scripts

1. **Data Management Scripts** (`PokeDataFunc/scripts/`):
   - Run **locally** but connect to **production database**
   - Require valid `.env` file with production credentials
   - Use with caution - they modify production data
   - Always test with `--set=ID` before using `--all`

2. **Deployment Scripts**:
   - Are backup methods - prefer GitHub Actions
   - Require Azure CLI authentication
   - Should only be used when CI/CD is unavailable

## ✅ Deployment Verification

### After Frontend Deployment

1. Visit: https://calm-mud-07a7f7a10.5.azurestaticapps.net
2. Check browser console for errors
3. Verify set dropdown loads
4. Test card search functionality

### After Backend Deployment

1. Check Function App health in Azure Portal
2. Test API endpoint:
   ```bash
   curl https://pokedatafunc.azurewebsites.net/api/GetSetList
   ```
3. Monitor Application Insights for errors
4. Check function execution logs

### After Data Updates

1. Run verification script:
   ```bash
   node PokeDataFunc/scripts/test-image-urls.js --verify
   ```
2. Test affected sets in the application
3. Monitor response times in Application Insights

## 🔄 Deployment Workflow Summary

### Standard Deployment Flow

1. **Development**: Make changes locally
2. **Testing**: Test with local servers
3. **Commit**: Push to feature branch
4. **Pull Request**: Create PR to main
5. **Automated Deploy**: Merge triggers CI/CD
6. **Verification**: Check production site

### Emergency Manual Deployment

**Frontend:**
```bash
npm run build
node deploy-frontend.js
```

**Backend:**
```bash
cd PokeDataFunc
npm run build
deploy.bat  # Windows
# OR
func azure functionapp publish pokedatafunc  # Cross-platform
```

## 🛠️ Troubleshooting

### Deployment Failures

1. **GitHub Actions Failed**:
   - Check workflow logs in Actions tab
   - Verify secrets are configured correctly
   - Ensure no TypeScript errors

2. **Manual Deploy Failed**:
   - Verify Azure CLI authentication: `az login`
   - Check deployment tokens are valid
   - Ensure build completes successfully

3. **Site Not Updating**:
   - Clear CDN cache in Azure Portal
   - Check deployment status in Azure Portal
   - Verify correct branch was deployed

### Performance Issues

1. **Slow API Responses**:
   - Run image URL optimization: `node scripts/manage-image-urls.js --all`
   - Check Redis cache connectivity
   - Monitor CosmosDB RU consumption

2. **Images Not Loading**:
   - Verify image URLs: `node scripts/test-image-urls.js --test-fix`
   - Fix leading zeros: `node scripts/manage-image-urls.js --fix --all`

## 📚 Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- Project-specific docs:
  - `/docs/cicd-deployment-guide.md` - CI/CD setup details
  - `/PokeDataFunc/scripts/README.md` - Script usage details
  - `/PokeDataFunc/docs/deployment-guide.md` - Function-specific deployment
