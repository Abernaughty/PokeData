# Pokémon Card Price Checker

A web application for looking up Pokémon card pricing data based on set name and card name.

## Features

- Search for cards by set name and card name
- View detailed pricing information from various sources
- Support for multiple card variants
- Offline caching for improved performance
- Responsive design

## Quick Start

The easiest way to run the application is to use the provided batch file:

```bash
run-app.bat
```

This script will automatically check and install all required dependencies before starting the application.

## System Requirements

- Windows operating system
- Node.js (v14 or higher)
- Internet connection (for initial setup and API calls)

## Dependencies

- Svelte (UI framework)
- Rollup (module bundler)
- PNPM (package manager)
- SirvCLI (static file server)

## Manual Installation

If you prefer to set up manually, this project uses pnpm for package management.

1. Clone the repository:
   ```bash
   git clone https://github.com/git-maber/PokeData.git
   cd PokeData
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the application:
   ```bash
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

```bash
pnpm dev
```

Or use the included batch file:

```bash
dev.bat
```

The app will be available at http://localhost:3000 with hot reloading enabled.

## Production Build

Build for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm clean` - Clean installation files
- `pnpm prod-install` - Install production dependencies only

## Project Structure

- `src/` - Source code
  - `components/` - UI components
  - `data/` - Static data and configuration
  - `services/` - API and data services
- `public/` - Static assets
  - `build/` - Compiled code (generated)
  - `images/` - Images
  - `mock/` - Mock data for development

## License

Private
