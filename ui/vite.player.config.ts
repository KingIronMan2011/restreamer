import { defineConfig } from 'vite';

export default defineConfig({
	publicDir: false,
	build: {
		outDir: 'build',
		emptyOutDir: false,
		sourcemap: false,
		cssCodeSplit: false,
		lib: {
			entry: 'src/public-player/plyr/index.ts',
			name: 'RestreamerPlyrBundle',
			formats: ['iife'],
			fileName: () => '_player/plyr/dist/plyr-public.js',
		},
		rollupOptions: {
			output: {
				assetFileNames: (assetInfo) => {
					if (
						assetInfo.names?.some((name) => name.endsWith('.css'))
					) {
						return '_player/plyr/dist/plyr-public.css';
					}

					return '_player/plyr/dist/[name][extname]';
				},
			},
		},
	},
});
