/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],
	base: '/ui/',
	resolve: {
		alias: {
			// MUI v9 dropped the old Grid item/xs/sm/md API. This alias
			// redirects all Grid imports to a compat wrapper that translates
			// the legacy props to the new `size` prop automatically.
			'@mui/material/Grid': resolve(__dirname, 'src/compat/Grid.tsx'),
		},
	},
	build: {
		outDir: 'build',
		sourcemap: false,
		chunkSizeWarningLimit: 2500,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.tsx',
	},
} as any);
