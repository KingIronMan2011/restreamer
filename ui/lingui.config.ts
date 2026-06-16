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
	macro: {
		corePackage: ['@lingui/core/macro'],
		jsxPackage: ['@lingui/react/macro'],
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
