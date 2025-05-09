// Use CommonJS require() instead of ESM imports
const svelte = require('rollup-plugin-svelte');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const livereload = require('rollup-plugin-livereload');
const { terser } = require('rollup-plugin-terser');
const css = require('rollup-plugin-css-only');
const replace = require('@rollup/plugin-replace');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const production = !process.env.ROLLUP_WATCH;

// Get environment variables with fallbacks
const API_BASE_URL = process.env.API_BASE_URL || 'https://maber-apim-test.azure-api.net/pokedata-api/v0';
// Force port 3000 for development server and livereload
const PORT = process.env.PORT || 3000;

function serve() {
    let server;

    function toExit() {
        if (server) server.kill(0);
    }

    return {
        writeBundle() {
            if (server) return;
            // Explicitly set port to 3000 and add --port flag
            server = require('child_process').spawn('pnpm', ['run', 'sirv', '--', '--dev', '--single', '--port', PORT.toString()], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true,
                env: { ...process.env, PORT: PORT.toString() }
            });

            process.on('SIGTERM', toExit);
            process.on('exit', toExit);
        }
    };
}

// Use CommonJS module.exports instead of export default
module.exports = {
    input: 'src/main.js',
    output: {
        sourcemap: true,
        format: 'esm',
        dir: 'public/build'
    },
    plugins: [
// Replace environment variables in the bundle
replace({
    preventAssignment: true,
    values: {
        'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
        'process.env.API_BASE_URL': JSON.stringify(API_BASE_URL),
        // Add a timestamp for cache busting in development
        'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString())
    }
}),
        svelte({
            compilerOptions: {
                dev: !production
            }
        }),
        css({ 
            output: 'bundle.css',
            // Ensure styles are properly extracted and minified
            minimize: production,
            // Add source maps in development mode
            sourceMap: !production
        }),
        nodeResolve({
            browser: true,
            dedupe: ['svelte']
        }),
        commonjs(),
        !production && serve(),
        !production && livereload({
            watch: 'public',
            port: PORT,
            verbose: true
        }),
        production && terser()
    ],
    watch: {
        clearScreen: false
    }
};
