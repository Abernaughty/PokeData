# Deploying to Azure Static Web Apps

This document provides instructions for deploying the Pokémon Card Price Checker application to Azure Static Web Apps with proper environment variable configuration.

## Prerequisites

1. An Azure account with an active subscription
2. A GitHub account
3. Your API credentials (API_KEY and API_SUBSCRIPTION_KEY)

## Setting Up GitHub Secrets

Before deploying to Azure Static Web Apps, you need to set up your API credentials as GitHub secrets:

1. Go to your GitHub repository
2. Navigate to "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret" and add the following secrets:
   - `API_BASE_URL`: Your API base URL
   - `API_KEY`: Your JWT token
   - `API_SUBSCRIPTION_KEY`: Your subscription key
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: This will be provided by Azure when you create your Static Web App

## Deployment Steps

### 1. Create an Azure Static Web App

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" and search for "Static Web App"
3. Click "Create"
4. Fill in the required details:
   - **Subscription**: Select your Azure subscription
   - **Resource Group**: Create a new one or select an existing one
   - **Name**: Enter a name for your app (e.g., "pokemon-card-price-checker")
   - **Region**: Select a region close to your users
   - **SKU**: Select the appropriate plan (Free tier is sufficient for testing)
   - **Source**: Select GitHub
   - **Organization**: Select your GitHub organization
   - **Repository**: Select your repository
   - **Branch**: main (or your preferred branch)
   - **Build Presets**: Select "Custom"
   - **App location**: "/"
   - **Output location**: "public"
5. Click "Review + create" and then "Create"

### 2. Configure Application Settings

After your Static Web App is created:

1. Go to your Static Web App in the Azure Portal
2. Navigate to "Configuration" → "Application settings"
3. Add the following application settings:
   - `API_BASE_URL`: Your API base URL
   - `API_KEY`: Your JWT token
   - `API_SUBSCRIPTION_KEY`: Your subscription key
   - `NODE_ENV`: Set to "production"
4. Click "Save"

### 3. GitHub Actions Workflow

A GitHub Actions workflow file (`.github/workflows/azure-static-web-app.yml`) has been created for you. This workflow:

1. Runs when you push to the main branch or create a pull request
2. Sets up Node.js and pnpm
3. Installs dependencies
4. Builds and deploys your application
5. Passes your environment variables to the build process

The workflow uses GitHub secrets to securely pass your API credentials to the build process.

## Environment Indicator

The application includes an environment indicator in the top-right corner of the header that only appears in development mode:

- **DEVELOPMENT**: Orange badge (only shown in local development)

This helps you quickly identify when you're working in the development environment. In production, no indicator is shown to maintain a clean interface for end users.

## Troubleshooting

If you encounter issues with your deployment:

1. Check the GitHub Actions logs for any build errors
2. Verify that all required secrets are correctly set in GitHub
3. Ensure that all application settings are correctly configured in Azure
4. Check that your API credentials are valid

## Security Considerations

- Never commit your `.env` file to version control
- Regularly rotate your API credentials
- Consider using Azure Key Vault for highly sensitive credentials
- Set up IP restrictions on your API if possible
