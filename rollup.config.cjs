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
const API_KEY = process.env.API_KEY || '';
const API_SUBSCRIPTION_KEY = process.env.API_SUBSCRIPTION_KEY || '';

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('pnpm', ['start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
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
				'process.env.API_KEY': JSON.stringify(API_KEY),
				'process.env.API_SUBSCRIPTION_KEY': JSON.stringify(API_SUBSCRIPTION_KEY),
				// Add a timestamp for cache busting in development
				'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString())
			}
		}),
		svelte({
			compilerOptions: {
				dev: !production
			}
		}),
		css({ output: 'bundle.css' }),
		nodeResolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		!production && serve(),
		!production && livereload('public'),
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
