# Pokémon Card Price Checker

A web application for looking up Pokémon card pricing data based on set name and card name. This tool helps collectors make informed decisions by providing pricing information from multiple sources in a user-friendly interface.

## Features

- Search for cards by set name and card name
- View detailed pricing information from various sources
- Support for multiple card variants
- Offline caching for improved performance
- Responsive design
- Set grouping by expansion series (Scarlet & Violet, Sword & Shield, etc.)
- Filtering of zero-value pricing results
- Consistent price decimal formatting
- Enhanced error handling with fallbacks

## Quick Start

The easiest way to run the application is to use the provided batch file:

### Command Prompt
```bash
run-app.bat
```

### PowerShell
```powershell
.\run-app.bat
```

This script will automatically check and install all required dependencies before starting the application.

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

## Setup Scripts

The following batch files are available to help with setup and running the application:

- `setup.bat` - Checks and installs Node.js, pnpm, and project dependencies
- `run-app.bat` - Runs the setup script and then starts the application
- `start.bat` - Starts the application (will run setup if dependencies are missing)
- `dev.bat` - Starts the development server (will run setup if dependencies are missing)

## Development

Start the development server:

**Command Prompt:**
```bash
pnpm dev
```

**PowerShell:**
```powershell
pnpm dev
```

Or use the included batch file:

**Command Prompt:**
```bash
dev.bat
```

**PowerShell:**
```powershell
.\dev.bat
```

The app will be available at http://localhost:3000 with hot reloading enabled.

## Production Build

Build for production:

**Command Prompt:**
```bash
pnpm build
```

**PowerShell:**
```powershell
pnpm build
```

Start the production server:

**Command Prompt:**
```bash
pnpm start
```

**PowerShell:**
```powershell
pnpm start
```

## Available Scripts

### Command Prompt
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm clean` - Clean installation files
- `pnpm prod-install` - Install production dependencies only

### PowerShell
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm clean` - Clean installation files
- `pnpm prod-install` - Install production dependencies only

Note: When running batch files in PowerShell, prefix them with `.\` (e.g., `.\run-app.bat`, `.\dev.bat`)

## Project Structure

- `src/` - Source code
  - `components/` - UI components (SearchableSelect, CardSearchSelect, etc.)
  - `data/` - Static data and configuration
  - `services/` - API and data services
    - `storage/` - Database and caching services
- `public/` - Static assets
  - `build/` - Compiled code (generated)
  - `images/` - Images
  - `mock/` - Mock data for development
  - `data/` - Static data files
- `docs/` - Documentation files
- `memory-bank/` - Project memory documentation

## License

Private
