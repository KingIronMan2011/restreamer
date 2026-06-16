import { formatter } from '@lingui/format-po';

const config = {
	catalogs: [
		{
			path: 'src/locales/{locale}/messages',
			include: ['src/'],
			exclude: ['**/node_modules/**'],
		},
	],
	format: formatter({ lineNumbers: false }),
	sourceLocale: 'en',
	// @lingui/macro is the v5 unified package; v6 splits into core/macro and react/macro
	macro: {
		corePackage: ['@lingui/core/macro', '@lingui/macro'],
		jsxPackage: ['@lingui/react/macro', '@lingui/macro'],
	},
	locales: [
		'en',
		'da',
		'de',
		'el',
		'es',
		'fr',
		'it',
		'ko',
		'pl',
		'pt-br',
		'ru',
		'sl',
		'tr',
		'uk',
		'zh-hans',
	],
};

export default config;
