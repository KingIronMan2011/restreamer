/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [
		react({
			babel: {
				// Keep babel-plugin-macros so @lingui/macro transforms work.
				plugins: ['macros'],
			},
		}) as any,
	],
	base: '/ui/',
	build: {
		outDir: 'build',
		sourcemap: false,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.tsx',
	},
} as any);
