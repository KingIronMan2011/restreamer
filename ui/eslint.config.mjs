import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'off',
		},
	},
	{
		ignores: [
			'dist/**',
			'build/**',
			'node_modules/**',
			'public/**',
			'src/public-player/videojs/*.min.js',
			'src/locales/**/messages.ts',
			'src/locales/_build/**',
		],
	},
	{
		files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
		plugins: {
			js,
			'react-hooks': {
				rules: {
					'exhaustive-deps': {
						meta: {
							type: 'problem',
							schema: [],
						},
						create: () => ({}),
					},
				},
			},
			import: {
				rules: {
					'no-anonymous-default-export': {
						meta: {
							type: 'suggestion',
							schema: [],
						},
						create: () => ({}),
					},
				},
			},
		},
		extends: ['js/recommended'],
		languageOptions: { globals: globals.browser },
	},
	...tseslint.configs.recommended,
	{
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-this-alias': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'getter-return': 'off',
			'no-empty': 'off',
			'no-func-assign': 'off',
			'no-prototype-builtins': 'off',
			'no-self-assign': 'off',
			'no-setter-return': 'off',
			'no-undef': 'off',
			'no-useless-assignment': 'off',
			'no-useless-escape': 'off',
			'prefer-const': 'off',
		},
	},
]);
