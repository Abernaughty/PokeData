# Scripts Directory

This directory contains build, deployment, and utility scripts for the PokeData project.

## Scripts Overview

### build-app.bat
Windows batch script for building the application for production.
- **Usage**: `scripts\build-app.bat` or `scripts\build-app.bat css` (to rebuild only CSS)
- **Purpose**: Creates a production build in the `public/build` directory

### build.js
Node.js build configuration script used by the build process.
- **Purpose**: Contains build configuration and optimization settings
- **Used by**: build-app.bat and rollup build process

### deploy-frontend.js
Node.js script for deploying the frontend to Azure Static Web Apps.
- **Usage**: `npm run deploy:frontend` or `node scripts/deploy-frontend.js`
- **Features**:
  - Interactive menu with multiple deployment options
  - Automatic token management from .env file
  - Cross-platform compatibility
  - Real-time progress indicator with animated spinner
  - Shows deployment status and custom domain URL

### server.bat
Unified server script with parameter support for running the development or production server.
- **Usage**: 
  - `scripts\server.bat` or `scripts\server.bat dev` - Development server with hot reloading
  - `scripts\server.bat prod` - Production server with optimized build
- **Features**:
  - Automatically detects and safely terminates any existing processes on port 3000
  - Includes automatic build check for production mode
  - Serves application at http://localhost:3000

### tools.bat
Provides utility tools for project maintenance and troubleshooting.
- **Usage**:
  - `scripts\tools.bat setup` - Install dependencies
  - `scripts\tools.bat diagnose` - Diagnose environment issues
  - `scripts\tools.bat fix-path` - Fix Node.js path issues
- **Purpose**: Centralized utility functions for development workflow

## Running Scripts

Scripts can be run in several ways:

1. **From root directory**: `scripts\script-name.bat`
2. **Using npm scripts** (where configured): `npm run script-name`
3. **Directly from scripts directory**: `cd scripts && script-name.bat`

## Notes

- All batch scripts are designed for Windows environments
- The deploy-frontend.js script is cross-platform (Windows/Mac/Linux)
- Scripts assume they may be called from the project root directory
- Environment variables are loaded from the .env file in the project root
