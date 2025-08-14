# Active Context

## Current Focus (August 12, 2025)
Memory Bank cleanup to remove references to non-implemented technologies.

### Latest Updates (Just Completed - August 12, 2025 - 4:38 PM)

1. **Memory Bank Cleanup - Removed Non-Implemented Technologies**:
   - **Purpose**: Clean up documentation to accurately reflect current architecture
   - **Technologies Removed from Documentation**:
     - Azure Cache for Redis (evaluated but not implemented)
     - Azure Blob Storage (evaluated but not implemented)
     - Azure CDN (evaluated but not implemented)
     - IndexedDB (legacy, replaced by Cosmos DB)
   
   - **Files Updated**:
     - `systemPatterns.md`: Removed architecture diagrams and references to Redis, Blob Storage, CDN, IndexedDB
     - `productContext.md`: Updated to reflect actual implemented infrastructure
     - `techContext.md`: Removed non-implemented technologies from lists and dependencies
     - `progress.md`: Updated infrastructure claims to match reality
   
   - **Key Findings**:
     - These technologies were evaluated during planning but determined unsuitable
     - Current architecture is simpler: Cosmos DB for storage, direct API image URLs
     - No Redis caching - using Cosmos DB as primary storage
     - No Blob Storage/CDN - images served directly from Pokemon TCG API
   
   - **Documentation Now Reflects**:
     - Actual implemented architecture only
     - Simplified cloud stack: Azure Functions, Cosmos DB, API Management, Static Web Apps
     - Direct API integration without intermediate caching layers
     - Cleaner, more accurate technical documentation

### Previous Updates (August 12, 2025 - 4:10 PM)

1. **GitHub MCP Server Integration**:
   - **Purpose**: Enable direct programmatic access to GitHub's API through Model Context Protocol
   - **Installation**: Successfully built and installed GitHub MCP Server from source
   
   - **Build Process**:
     - Cloned repository from https://github.com/github/github-mcp-server
     - Installed Go v1.24.6 via winget
     - Built executable: `github-mcp-server.exe`
     - Configured with GitHub Personal Access Token
   
   - **Configuration Details**:
     - Server Name: `github.com/github/github-mcp-server`
     - Location: `C:\Users\maber\OneDrive\Documents\Cline\MCP\github-mcp-server`
     - Executable: `github-mcp-server.exe` (19.3 MB)
     - Config File: `cline_mcp_settings.json` in VS Code global storage
     - Authentication: GitHub PAT (Personal Access Token)
   
   - **Verified GitHub Access**:
     - Successfully retrieved GitHub profile for user Abernaughty
     - Name: Mike Abernathy
     - Email: mabernathy87@gmail.com
     - Public Repos: 5
     - Account Created: February 19, 2017
   
   - **Available Tools** (100+ GitHub operations):
     - Repository: File operations, branches, commits, tags, releases
     - Issues: Create, update, search, manage sub-issues, assign Copilot
     - Pull Requests: Create, merge, review, request Copilot review
     - GitHub Actions: Trigger workflows, monitor runs, download artifacts
     - Security: Monitor Dependabot, code scanning, secret scanning alerts
     - Search: Code, repositories, users, organizations, issues, PRs
     - Notifications: List, dismiss, manage subscriptions
     - Gists: Create, update, list
   
   - **Documentation Updates**:
     - Added comprehensive GitHub MCP Server section to `techContext.md`
     - Documented installation process, build steps, and available tools
     - Listed integration benefits and use cases for PokeData project
     - Updated development tools section with Go installation

### Previous Updates (January 12, 2025 - 3:49 PM)

1. **Azure MCP Server Integration**:
   - **Purpose**: Enable direct programmatic access to Azure services through Model Context Protocol
   - **Installation**: Successfully installed Azure MCP Server v0.5.4
   
   - **Configuration Details**:
     - Server Name: `github.com/Azure/azure-mcp`
     - Location: `C:\Users\maber\OneDrive\Documents\Cline\MCP\azure-mcp`
     - Config File: `cline_mcp_settings.json` in VS Code global storage
     - Authentication: Uses existing Azure CLI credentials (mabernathy87@gmail.com)
   
   - **Available Azure Subscriptions**:
     - Thunderdome (Active) - Primary subscription with Cosmos DB
     - Bing Bong (Active) - Secondary subscription
     - Subscrippy (Disabled) - Inactive subscription
   
   - **Verified Cosmos DB Access**:
     - Account: `pokemon-card-pricing-db`
     - Database: `PokemonCards`
     - Containers: `Cards` (card data), `Sets` (set information)
     - Successfully queried sample data showing Prismatic Evolutions cards with pricing
   
   - **Available Services** (20+ Azure services):
     - Data: Cosmos DB, Storage, SQL, PostgreSQL, Redis
     - Compute: AKS, Functions, Virtual Desktop
     - Developer: App Config, Key Vault, Service Bus
     - Monitoring: Azure Monitor, Kusto, Grafana
     - AI/Search: Azure AI Search, Foundry
     - Management: Subscriptions, RBAC, Resource Groups
     - IaC: Bicep, Terraform best practices, Azure Developer CLI
   
   - **Documentation Updates**:
     - Added comprehensive Azure MCP Server section to `techContext.md`
     - Documented installation, configuration, and usage patterns
     - Listed all available services and tools with examples

### Previous Updates (January 12, 2025 - 3:00 PM)

1. **.gitignore File Cleanup**:
   - **Problem**: .gitignore contained irrelevant Python-related entries and non-existent files
   - **Solution**: Cleaned up .gitignore to only include relevant patterns for JavaScript/TypeScript project
   
   - **Removed Entries**:
     - All Python-related patterns (20+ lines) - project is JavaScript/TypeScript only
     - Non-existent batch files (init-git.bat, stage-and-commit.bat, push-to-github.bat)
   
   - **Improvements Made**:
     - Better organization with clearer section headers
     - Added `.vscode/` to IDE section for VS Code settings
     - Added `desktop.ini` and `*.orig` files to ignored patterns
     - Added temp directories (`.temp/`, `.tmp/`)
     - Consolidated log file patterns
   
   - **Clarifications**:
     - `PokeDataFunc/dist/` correctly remains ignored (contains TypeScript compilation output)
     - Data files in `PokeDataFunc/data/` are the source files and should be tracked
     - Files in `PokeDataFunc/dist/data/` are copies/build artifacts and should remain ignored

2. **Project Structure Clarification**:
   - **Monorepo Architecture Confirmed**:
     - Frontend (Svelte app) at project root with its own package.json and rollup.config.cjs
     - Backend (Azure Functions) in PokeDataFunc/ subdirectory with separate package.json
     - This is the correct structure for separate frontend/backend with different build tools
   
   - **File Locations Verified**:
     - `deploy-frontend.js` and `server.bat` are correctly in `scripts/` folder (not root)
     - All utility scripts properly organized in `scripts/` directory

### Previous Updates (January 12, 2025 - 2:44 PM)

1. **Root Directory Reorganization**:
   - **Problem**: Build and utility scripts cluttering the root directory
   - **Solution**: Created `scripts/` directory and moved all build/utility scripts
   
   - **Files Moved to `scripts/` (5 total)**:
     - `build-app.bat` → `scripts/build-app.bat`
     - `build.js` → `scripts/build.js`
     - `deploy-frontend.js` → `scripts/deploy-frontend.js`
     - `server.bat` → `scripts/server.bat`
     - `tools.bat` → `scripts/tools.bat`
   
   - **Documentation Updates**:
     - Created `scripts/README.md` documenting each script's purpose and usage
     - Updated main `README.md` with new script paths
     - Updated `package.json` deploy:frontend script path
   
   - **Benefits**:
     - Cleaner root directory (reduced from 15 to 10 files)
     - Better organization with related scripts grouped together
     - Follows common JavaScript/Node.js project best practices

### Previous Updates (January 12, 2025 - Late Afternoon)

1. **PokeDataFunc Scripts Consolidation**:
   - **Problem**: 9 redundant scripts with overlapping functionality causing maintenance overhead
   - **Solution**: Consolidated into 3 multi-purpose scripts with command-line options
   
   - **New Consolidated Scripts**:
     - `set-mapping.js`: All set mapping operations (--analyze, --generate, --manual)
     - `manage-image-urls.js`: All image URL management (--fix, --all, --set=ID)
     - `test-image-urls.js`: All testing and verification (--simple, --with-db, --test-fix, --verify)
   
   - **Scripts Removed (9 total)**:
     - `analyze-ptcgo-mapping.js` → Now `set-mapping.js --analyze`
     - `generate-set-mapping.js` → Now `set-mapping.js --generate --manual`
     - `generate-optimized-set-mapping.js` → Now `set-mapping.js --generate`
     - `update-image-urls.js` → Now `manage-image-urls.js`
     - `fix-image-urls.js` → Now `manage-image-urls.js --fix`
     - `test-image-url-update.js` → Now `test-image-urls.js --with-db`
     - `test-image-url-simple.js` → Now `test-image-urls.js --simple`
     - `test-url-fix.js` → Now `test-image-urls.js --test-fix`
     - `verify-optimization.js` → Now `test-image-urls.js --verify`
   
   - **Documentation Created**:
     - `PokeDataFunc/scripts/README.md`: Comprehensive usage guide for consolidated scripts
     - Includes prerequisites, typical workflows, troubleshooting, and migration notes

2. **Comprehensive Deployment Guide Created**:
   - **New File**: `DEPLOYMENT_GUIDE.md` at project root
   - **Clear Distinction Between Environments**:
     - Local Development: Scripts that run locally only
     - Production Deployment: CI/CD via GitHub Actions (primary) with manual backup options
     - Data Management: Scripts that run locally but connect to production DB
   
   - **Key Deployment Methods Documented**:
     - Frontend: GitHub Actions → Azure Static Web Apps (automatic on push to main)
     - Backend: GitHub Actions → Azure Functions (automatic on push to main)
     - Database/Cache: Managed Azure services (no deployment needed)
   
   - **Important Clarifications**:
     - Data management scripts run locally but modify production database
     - Manual deployment scripts are backup methods only
     - CI/CD is the preferred deployment method for both frontend and backend

### Previous Updates (January 12, 2025 - Afternoon)

1. **Build/Deployment Script Consolidation**:
   - **Files Removed (7 total)**:
     - `package-lock.json` - Redundant npm file (project uses pnpm)
     - `deploy-to-production.bat` - Obsolete deployment script
     - `run-app.bat` - Redundant launcher script
     - `dev-server.bat` - Replaced by unified script
     - `prod-server.bat` - Replaced by unified script
   
   - **Unified Server Script Created**:
     - Created `server.bat` with parameter support
     - Usage: `server.bat` (defaults to dev mode)
     - Usage: `server.bat dev` (development with hot reloading)
     - Usage: `server.bat prod` (production with optimized build)
   
   - **Package.json Cleanup**:
     - Removed redundant scripts: `sirv`, `prod-install`, `prune`
     - Removed duplicate deploy scripts

2. **Frontend Deployment Script Fixes**:
   - Fixed static progress display with animated spinner
   - Corrected app URL to https://pokedata.maber.io
   - Enhanced deployment feedback with timestamps

### Previous Updates (January 12, 2025 - Morning)

1. **Frontend UI Improvements**:
   - Fixed PSA graded pricing indentation
   - Added comma separators to prices ($1,234.56 format)
   - Switched to large image URLs for better quality

### Previous Updates (January 10, 2025)

1. **GitHub Actions Federated Credential Authentication Fixed**
2. **Pre-Deployment Testing Implementation**
3. **Deploy.bat Improvements**

## Current Project State

### Scripts Organization
- **Frontend Scripts** (in `scripts/`): 
  - `server.bat` - Unified development/production server
  - `deploy-frontend.js` - Azure Static Web Apps deployment
  - `build-app.bat` - Production build script
  - `build.js` - Build configuration
  - `tools.bat` - Utility tools for setup and diagnostics
- **Backend Scripts**: 
  - `PokeDataFunc/deploy.bat` - Azure Functions deployment
  - `PokeDataFunc/test-api.js` - API testing
- **Data Management**: 3 consolidated scripts in `PokeDataFunc/scripts/`
- **Documentation**: Comprehensive guides for deployment and script usage

### Deployment Architecture
- **Primary Method**: GitHub Actions CI/CD (push to main triggers deployment)
- **Backup Method**: Manual scripts for emergency deployments
- **Data Updates**: Local scripts with production credentials

### Key URLs
- Production Frontend: https://pokedata.maber.io
- Production API: https://pokedata-func.azurewebsites.net
- Staging API: https://pokedata-func-staging.azurewebsites.net
- GitHub Actions: https://github.com/Abernaughty/PokeData/actions

## Next Steps
1. Monitor deployments after pushing consolidated scripts
2. Consider creating automated tests for the consolidated scripts
3. Review and potentially consolidate documentation files in /docs
4. Set up monitoring for script execution in production

## Important Patterns
- **Script Consolidation**: Reduce redundancy by combining similar scripts with options
- **Clear Documentation**: Separate guides for different audiences (developers vs. operators)
- **Environment Clarity**: Always distinguish between local, staging, and production
- **CI/CD First**: Manual deployment scripts are backup options only

## Configuration Requirements
- **Frontend**: No .env needed in production (configured in Azure Portal)
- **Backend**: Environment variables set in Azure Function App Configuration
- **Local Scripts**: Require .env with production credentials (use cautiously)

## Testing Checklist
After any deployment:
1. Frontend: Check https://pokedata.maber.io loads correctly
2. Backend: Test API endpoints return 200 status
3. Data Scripts: Run `test-image-urls.js --verify` to check optimizations
4. Monitor Application Insights for errors

## Development Workflow
1. Make changes locally
2. Test with local servers (`server.bat` for frontend, `func start` for backend)
3. Push to feature branch
4. Create PR to main (triggers validation)
5. Merge to main (auto-deploys via GitHub Actions)
6. Verify deployment in production
7. Run data scripts if needed (with caution)

The project now has a much cleaner structure with consolidated scripts, clear deployment paths, and comprehensive documentation for all use cases.
