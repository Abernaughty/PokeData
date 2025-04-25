# API Credentials Debugging Guide

This guide will help you diagnose and fix issues with API credentials in your PokeData application.

## Debugging Tools Added

We've added several debugging tools to help identify where the API credentials are being lost:

1. **Client-Side Debugging**:
   - Enhanced logging in `apiConfig.js`
   - Detailed header inspection in `corsProxy.js`
   - Service initialization validation in `pokeDataService.js`
   - Standalone debug script in `debug-env.js`

2. **Build Process Debugging**:
   - GitHub Actions workflow debugging steps
   - Environment variable validation during build
   - Configuration file inspection

## How to Use These Tools

### 1. GitHub Actions Build Debugging

After pushing these changes to GitHub, check the GitHub Actions logs:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select the latest workflow run
4. Look for the output of these steps:
   - "Debug Environment Variables"
   - "Execute Environment Debug Script"
   - "Debug Rollup Config"

These steps will show if your GitHub secrets are being properly accessed during the build process.

### 2. Browser Console Debugging

After deploying to Azure:

1. Open your application in a web browser
2. Open the browser's developer tools (F12 or right-click → Inspect)
3. Go to the "Console" tab
4. Look for the following sections:
   - "=== Environment Variables Debug ==="
   - "=== PokeDataService Initialization ==="
   - "Headers summary" (when API calls are made)

### 3. What to Look For

#### In GitHub Actions Logs:

- **Secrets Existence**: Check if `API_KEY exists: true` and `API_SUBSCRIPTION_KEY exists: true`
- **Secret Lengths**: Verify that the lengths are greater than 0
- **Rollup Configuration**: Confirm that the replace plugin is properly configured

#### In Browser Console:

- **Environment Variables**: Check if they exist and have proper lengths
- **API Configuration**: Verify the API_CONFIG object has the correct values
- **Request Headers**: Look for warnings about missing or malformed headers

## Common Issues and Solutions

### 1. Node.js Version Compatibility

**Symptoms**:
- GitHub Actions logs show: `ERROR: This version of pnpm requires at least Node.js v18.12`
- Workflow fails during the `pnpm install` step

**Solutions**:
- The workflow has been updated to use Node.js v18 instead of v14
- If you're still seeing this error, check that the workflow file is using the correct Node.js version

### 2. GitHub Secrets Not Available During Build

**Symptoms**:
- GitHub Actions logs show `API_KEY exists: false`
- Browser console shows `API_KEY not found in environment variables`

**Solutions**:
- Verify GitHub secrets are correctly set up
- Check workflow file for correct secret references
- Ensure secrets are being passed to the build process

### 2. Environment Variables Not Injected into Bundle

**Symptoms**:
- GitHub Actions logs show secrets exist
- Browser console shows `API_KEY not found in environment variables`

**Solutions**:
- Check Rollup configuration for proper variable replacement
- Verify that `process.env.API_KEY` is being replaced during build
- Ensure the build process is using the correct environment

### 3. API Configuration Not Using Environment Variables

**Symptoms**:
- Browser console shows environment variables exist
- API calls still have empty headers

**Solutions**:
- Check `apiConfig.js` for proper use of environment variables
- Verify that `getHeaders()` method is using the variables correctly
- Ensure no code is overriding the headers

### 4. Format Issues with Headers

**Symptoms**:
- Browser console shows `Authorization header contains "Bearer" but no token`
- API calls fail with authentication errors

**Solutions**:
- Check the format of the Authorization header
- Ensure the token is being properly concatenated
- Verify the token format is correct for your API

## Next Steps After Diagnosis

Once you've identified the issue:

1. **For GitHub Secrets Issues**:
   - Recreate the secrets in GitHub
   - Check for any special characters that might need escaping

2. **For Build Process Issues**:
   - Update the Rollup configuration
   - Modify how environment variables are accessed

3. **For API Configuration Issues**:
   - Update the `apiConfig.js` file
   - Fix any formatting issues with headers

4. **For Azure Configuration Issues**:
   - Check Azure Static Web App configuration
   - Verify that runtime settings are correct

## Cleanup After Debugging

Once the issue is resolved:

1. Remove or comment out the debug script import in `main.js`
2. Consider removing the `debug-env.js` file
3. Reduce the verbose logging in production builds

## Need More Help?

If you're still experiencing issues after following this guide, consider:

1. Checking Azure Static Web Apps documentation for environment variable handling
2. Reviewing the API documentation for authentication requirements
3. Implementing a server-side proxy to handle API authentication more securely
