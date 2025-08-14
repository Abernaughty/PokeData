# Pokémon Card Price Checker

A web application for looking up Pokémon card pricing data based on set name and card name. This tool helps collectors make informed decisions by providing pricing information from multiple sources in a user-friendly interface.

## Features

- Search for cards by set name and card name
- View detailed pricing information from various sources
- Set grouping by expansion series (Scarlet & Violet, Sword & Shield, etc.)
- Filtering of zero-value pricing results
- Consistent price decimal formatting
- Enhanced error handling with fallbacks

## Planned Features

- Responsive design for better mobile experience
- Card images in price results
- Price history graphs
- Collection management

## Quick Start

The easiest way to run the application is to use the provided server script:

### Command Prompt
```bash
scripts\server.bat
```

### PowerShell
```powershell
.\scripts\server.bat
```

This will start the development server with hot reloading at http://localhost:3000.

## System Requirements

- Windows operating system
- Node.js (v14 or higher)
- Internet connection (for initial setup and API calls)

## Dependencies

- Svelte (UI framework) - Core UI framework for building the application
- Rollup (module bundler) - Bundles JavaScript modules for browser use
- PNPM (package manager) - Fast, disk space efficient package manager
- SirvCLI (static file server) - Serves the compiled application files during development and production, handling HTTP requests to the local server at port 3000

## Manual Installation

If you prefer to set up manually, this project uses pnpm for package management.

1. Clone the repository:
   
   **Command Prompt:**
   ```bash
   git clone https://github.com/Abernaughty/PokeData.git
   cd PokeData
   ```
   
   **PowerShell:**
   ```powershell
   git clone https://github.com/Abernaughty/PokeData.git
   cd PokeData
   ```

2. Install dependencies:
   
   **Command Prompt:**
   ```bash
   pnpm install
   ```
   
   **PowerShell:**
   ```powershell
   pnpm install
   ```

3. Start the application:
   
   **Command Prompt:**
   ```bash
   pnpm start
   ```
   
   **PowerShell:**
   ```powershell
   pnpm start
   ```

## Scripts

All utility scripts are located in the `scripts/` directory:

- **scripts/server.bat**: Unified server script with parameter support
  - Use `scripts\server.bat` or `scripts\server.bat dev` for development server with hot reloading
  - Use `scripts\server.bat prod` for production server with optimized build
  - Automatically detects and safely terminates any existing processes on port 3000
- **scripts/build-app.bat**: Builds the application for production
  - Use `scripts\build-app.bat` for a full build
  - Use `scripts\build-app.bat css` to rebuild only CSS
- **scripts/tools.bat**: Provides utility tools
  - Use `scripts\tools.bat setup` to install dependencies
  - Use `scripts\tools.bat diagnose` to diagnose environment issues
  - Use `scripts\tools.bat fix-path` to fix Node.js path issues
- **scripts/deploy-frontend.js**: Deploy to Azure Static Web Apps
  - Use `npm run deploy:frontend` to run the deployment script

See [scripts/README.md](scripts/README.md) for detailed documentation.

## Development

Start the development server:

**Command Prompt:**
```bash
scripts\server.bat dev
```

**PowerShell:**
```powershell
.\scripts\server.bat dev
```

The app will be available at http://localhost:3000 with hot reloading enabled. The development server is configured to always use port 3000, which is required for API Management service integration.

## Production Build

Build for production:

**Command Prompt:**
```bash
scripts\build-app.bat
```

**PowerShell:**
```powershell
.\scripts\build-app.bat
```

Start the production server:

**Command Prompt:**
```bash
scripts\server.bat prod
```

**PowerShell:**
```powershell
.\scripts\server.bat prod
```

## Available Scripts

### Command Prompt
- `pnpm dev` - Start development server (port 3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server (port 3000)
- `pnpm clean` - Clean installation files
- `pnpm prod-install` - Install production dependencies only

### PowerShell
- `pnpm dev` - Start development server (port 3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server (port 3000)
- `pnpm clean` - Clean installation files
- `pnpm deploy:frontend` - Deploy frontend to Azure Static Web Apps

Note: When running batch files in PowerShell, prefix them with `.\` (e.g., `.\scripts\server.bat`, `.\scripts\build-app.bat`)

## Project Structure

- `src/` - Source code
  - `components/` - UI components (SearchableSelect, CardSearchSelect, etc.)
  - `data/` - Static data and configuration
  - `services/` - API and data services
    - `storage/` - Database and caching services
- `public/` - Static assets
  - `build/` - Compiled code (generated)
  - `images/` - Images
  - `data/` - Static data files
- `scripts/` - Build, deployment, and utility scripts
- `docs/` - Documentation files
- `memory-bank/` - Project memory documentation
- `PokeDataFunc/` - Azure Functions backend

## License

Private
