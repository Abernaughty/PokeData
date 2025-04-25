# Quick API Credentials Debugging Guide

This guide provides immediate steps to diagnose API credential issues without waiting for a GitHub workflow run.

## Immediate Debugging Steps

### 1. Run the Local Development Server

```bash
npm run dev
```

### 2. Access the Browser Debug Tool

Once the app is running, open it in your browser and:

1. Open the browser's developer tools (F12 or right-click → Inspect)
2. Go to the "Console" tab
3. Run the following commands:

```javascript
// Load the debug script and run the diagnostic function in one step
fetch('/debug-api.js')
  .then(r => r.text())
  .then(t => {
    eval(t);
    return debugApiCredentials();
  })
  .then(result => {
    console.log('Debug results summary:', result);
  })
  .catch(err => {
    console.error('Debug error:', err);
  });
```

### 3. Interpret the Results

The debug tool will show:

- ✅ If API_CONFIG is properly defined
- API key and subscription key existence and lengths
- Generated headers for API calls
- ❌ Error indicators for empty or malformed headers

### 4. Common Issues and Solutions

#### Empty API Key or Subscription Key

**Symptoms**:
- Console shows: `❌ API Key is empty`
- Console shows: `❌ Subscription Key header is empty`

**Causes**:
1. Environment variables not injected during build
2. Incorrect variable names in GitHub secrets
3. Rollup not properly replacing environment variables

**Solutions**:
1. Check your `.env` file locally to ensure variables are defined
2. Verify GitHub secrets are correctly named and have values
3. Check Rollup configuration in `rollup.config.js`

#### Malformed Authorization Header

**Symptoms**:
- Console shows: `❌ Authorization header is empty or malformed`
- Header shows as just `Bearer` without a token

**Causes**:
1. API_KEY environment variable exists but is empty
2. Incorrect string concatenation in `getHeaders()` method

**Solutions**:
1. Check the format of your JWT token in GitHub secrets
2. Verify the `getHeaders()` method in `apiConfig.js`

## Alternative Debugging Method

If you prefer to modify the HTML directly:

1. Edit `public/index.html`
2. Uncomment the debug script tag:
   ```html
   <script src='./debug-api.js'></script>
   ```
3. Reload the page and run `debugApiCredentials()` in the console

## Next Steps

After identifying the issue:

1. Fix the environment variables in your GitHub repository
2. Update your Azure Static Web App configuration if needed
3. Push the changes and deploy again

For more detailed debugging information, see the full [Debugging Guide](./debugging-guide.md).
