# Azure Functions Deployment Configuration Guide

## Critical Issue Resolution: GitHub Actions Package Preparation

### Issue Summary

**CRITICAL**: GitHub Actions workflows deploying Azure Functions may complete successfully but functions don't appear in Azure Portal due to incomplete package preparation.

### Root Cause Analysis

#### The Problem
- GitHub Actions workflow was only deploying compiled JavaScript files
- Missing essential Azure Functions configuration and runtime files
- Azure Functions runtime couldn't initialize without complete package structure

#### What Was Missing
1. **host.json** - Azure Functions host configuration (CRITICAL)
2. **package.json** - Runtime dependency manifest (CRITICAL) 
3. **node_modules/** - Production dependencies (CRITICAL)
4. **local.settings.json** - Local development settings (optional)

#### Symptoms
- ✅ GitHub Actions workflow shows "success"
- ✅ TypeScript compilation works correctly
- ✅ Deployment upload completes without errors
- ❌ Functions don't appear in Azure Portal
- ❌ API endpoints return 404 errors
- ❌ Function app appears empty in Azure console

### The Solution: Complete Package Preparation

#### Updated GitHub Actions Workflow

```yaml
- name: 'Build TypeScript to dist directory'
  run: pnpm run build
  working-directory: ./PokeDataFunc

- name: 'Copy essential files to dist'
  run: |
    cp host.json dist/host.json
    if [ -f "local.settings.json" ]; then
      cp local.settings.json dist/local.settings.json
    fi
  working-directory: ./PokeDataFunc

- name: 'Create production package.json in dist'
  run: |
    cat > dist/package.json << 'EOF'
    {
      "name": "pokedatafunc",
      "version": "1.0.0",
      "main": "index.js",
      "engines": {
        "node": ">=20.0.0"
      },
      "dependencies": {
        "@azure/cosmos": "^4.3.0",
        "@azure/functions": "^4.7.2",
        "@azure/storage-blob": "^12.27.0",
        "@typespec/ts-http-runtime": "^0.2.2",
        "axios": "^1.9.0",
        "cookie": "^0.6.0",
        "dotenv": "^16.5.0",
        "redis": "^4.7.0"
      }
    }
    EOF
  working-directory: ./PokeDataFunc

- name: 'Install production dependencies in dist'
  run: |
    cd dist
    npm install --production --silent
  working-directory: ./PokeDataFunc

- name: 'Verify complete dist package contents'
  run: |
    echo "=== Dist directory contents ==="
    ls -la dist/
    echo "=== Package.json exists ==="
    cat dist/package.json
    echo "=== Host.json exists ==="
    cat dist/host.json
    echo "=== Node_modules exists ==="
    ls -la dist/node_modules/ | head -10
  working-directory: ./PokeDataFunc

- name: 'Deploy to Azure Functions Staging'
  uses: Azure/functions-action@v1
  with:
    app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
    slot-name: 'staging'
    package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}  # ./PokeDataFunc/dist
```

### Microsoft Azure Functions Best Practices

#### "Run from Package File" Recommendation
From [Microsoft's official documentation](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node):

> "To speed up the cold start process, run your functions as a package file when possible. Many deployment methods use this model by default, but if you're experiencing large cold starts you should check to make sure you're running this way."

#### Complete Package Structure Required
Azure Functions requires a complete deployment package:

```
dist/
├── host.json              ← Azure Functions configuration
├── package.json           ← Runtime dependencies manifest  
├── node_modules/          ← Production dependencies
├── index.js              ← Compiled entry point
├── functions/            ← Compiled function implementations
├── models/               ← Compiled data models
├── services/             ← Compiled services
└── utils/                ← Compiled utilities
```

### Deployment Method Comparison

#### ❌ Broken: Incomplete Package (Before Fix)
```yaml
steps:
  - name: Build TypeScript
    run: pnpm run build
  - name: Deploy
    uses: Azure/functions-action@v1
    with:
      package: ./PokeDataFunc/dist  # Only contains compiled JS
```

**Result**: Functions don't appear in Azure Portal

#### ✅ Working: Complete Package (After Fix)
```yaml
steps:
  - name: Build TypeScript
    run: pnpm run build
  - name: Copy host.json to dist
    run: cp host.json dist/host.json
  - name: Create production package.json in dist
    run: cat > dist/package.json << 'EOF' [package content] EOF
  - name: Install production dependencies in dist
    run: cd dist && npm install --production
  - name: Deploy
    uses: Azure/functions-action@v1
    with:
      package: ./PokeDataFunc/dist  # Complete package
```

**Result**: Functions appear correctly in Azure Portal

### Manual Deployment (deploy.bat) vs GitHub Actions

#### Why deploy.bat Worked
The manual deployment script already included complete package preparation:

```batch
echo Step 3: Copying essential files...
copy /Y "host.json" "dist\host.json"
copy /Y "local.settings.json" "dist\local.settings.json"

echo Step 4: Creating production package.json...
(echo { && echo "name": "pokedatafunc", ...) > "dist\package.json"

echo Step 5: Installing production dependencies...
cd dist && npm install --production
```

#### Why GitHub Actions Failed
The GitHub Actions workflow was missing these preparation steps, only deploying compiled TypeScript output.

### Verification Steps

#### Required Files Check
Before deployment, verify these files exist in dist/:
- ✅ `host.json` - Azure Functions configuration
- ✅ `package.json` - Dependencies manifest with correct main field
- ✅ `node_modules/` - Production dependencies installed
- ✅ `index.js` - Compiled entry point
- ✅ Function directories with compiled JavaScript

#### Post-Deployment Validation
After deployment, verify in Azure Portal:
- ✅ Functions appear in Functions list
- ✅ HTTP triggers show correct URLs
- ✅ Timer triggers show correct schedules
- ✅ Function app runtime initializes without errors

### Common Pitfalls to Avoid

#### 1. Missing Configuration Files
❌ **Don't**: Deploy only compiled JavaScript
✅ **Do**: Include host.json and package.json

#### 2. Wrong Package.json Main Field
❌ **Don't**: `"main": "dist/index.js"` (when deploying dist/ folder)
✅ **Do**: `"main": "index.js"` (relative to deployment package)

#### 3. Missing Dependencies
❌ **Don't**: Deploy without node_modules
✅ **Do**: Run `npm install --production` in deployment package

#### 4. Development Dependencies in Production
❌ **Don't**: Include devDependencies in production package
✅ **Do**: Use `--production` flag to install only runtime dependencies

### Troubleshooting Guide

#### Functions Don't Appear in Portal
1. **Check host.json**: Verify file exists in deployment package
2. **Check package.json**: Verify correct main field and dependencies
3. **Check node_modules**: Verify production dependencies installed
4. **Check Function App Logs**: Look for initialization errors

#### Functions Appear but Don't Work
1. **Check Environment Variables**: Verify all required settings
2. **Check Dependency Versions**: Ensure compatibility
3. **Check Import Paths**: Verify relative imports work in deployed structure

### Best Practices Summary

1. **Always use complete package preparation** for Azure Functions deployments
2. **Test deployment process locally** before committing to CI/CD
3. **Verify package contents** before deployment with verification steps
4. **Follow Microsoft's "package file" recommendation** for optimal performance
5. **Keep deployment methods consistent** between manual and automated deployments
6. **Include comprehensive verification** in CI/CD workflows

### Implementation Checklist

- [ ] Copy host.json to deployment package
- [ ] Create production package.json in deployment package  
- [ ] Install production dependencies in deployment package
- [ ] Verify package contents before deployment
- [ ] Test deployment in staging environment
- [ ] Confirm functions appear in Azure Portal
- [ ] Validate function endpoints work correctly
- [ ] Document any environment-specific configuration

---

## Related Documentation

- [Azure Functions Node.js Reference](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
- [Azure Functions Deployment Best Practices](https://learn.microsoft.com/en-us/azure/azure-functions/functions-best-practices)
- [GitHub Actions for Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions)

---

*This guide documents the critical deployment configuration issue resolved on 2025-06-10 that prevented GitHub Actions-deployed functions from appearing in Azure Portal despite successful workflow completion.*
