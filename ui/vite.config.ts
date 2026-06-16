/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	base: '/ui/',
	build: {
		outDir: 'build',
		sourcemap: false,
		chunkSizeWarningLimit: 600,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.tsx',
	},
} as any);
