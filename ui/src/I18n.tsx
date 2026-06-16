import React from 'react';

import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
	I18nextProvider,
	initReactI18next,
	useTranslation,
} from 'react-i18next';

import resources, { supportedLanguages } from './locales/resources';

type MessageDescriptor = {
	id: string;
	values?: Record<string, unknown>;
};

type TranslationContext = {
	components: React.ReactElement[];
	values: Record<string, unknown>;
	valueIndex: number;
	componentIndex: number;
};

const aliases: Record<string, string> = {
	pt: 'pt-br',
	'zh-cn': 'zh-hans',
};

function getAlias(lang: string | null | undefined) {
	if (!lang) {
		return '';
	}

	return aliases[lang] ?? lang;
}

function normalizeLanguage(lang: string) {
	return getAlias(lang.toLowerCase());
}

function normalizeMessage(value: string) {
	return value.replace(/\s+/g, ' ').trim();
}

function translate(id: string, values: Record<string, unknown> = {}) {
	return i18next.t(id, {
		defaultValue: id,
		...values,
	});
}

function cloneWithChildren(
	component: React.ReactElement,
	children: React.ReactNode,
) {
	return React.cloneElement(component, undefined, children);
}

function renderTranslatedMessage(
	message: string,
	components: React.ReactElement[],
	values: Record<string, unknown>,
): React.ReactNode[] {
	const nodes: React.ReactNode[] = [];
	const matcher = /<(\d+)>(.*?)<\/\1>|<(\d+)\/>|\{([^{}]+)\}/gs;
	let cursor = 0;
	let match: RegExpExecArray | null;

	while ((match = matcher.exec(message)) !== null) {
		if (match.index > cursor) {
			nodes.push(message.slice(cursor, match.index));
		}

		if (match[1] !== undefined) {
			const index = Number(match[1]);
			const component = components[index];
			const children = renderTranslatedMessage(
				match[2],
				components,
				values,
			);

			nodes.push(
				component ? cloneWithChildren(component, children) : children,
			);
		} else if (match[3] !== undefined) {
			const component = components[Number(match[3])];
			nodes.push(component ?? '');
		} else if (match[4] !== undefined) {
			nodes.push(values[match[4]] as React.ReactNode);
		}

		cursor = matcher.lastIndex;
	}

	if (cursor < message.length) {
		nodes.push(message.slice(cursor));
	}

	return nodes;
}

function serializeChild(
	child: React.ReactNode,
	context: TranslationContext,
): string {
	if (child === null || child === undefined || typeof child === 'boolean') {
		return '';
	}

	if (Array.isArray(child)) {
		return child.map((item) => serializeChild(item, context)).join('');
	}

	if (typeof child === 'string') {
		return child;
	}

	if (typeof child === 'number') {
		const index = context.valueIndex++;
		context.values[String(index)] = child;
		return `{${index}}`;
	}

	if (React.isValidElement(child)) {
		const index = context.componentIndex++;
		context.components[index] = child;

		const content = serializeChild(
			(child.props as { children?: React.ReactNode }).children,
			context,
		);

		return content.length === 0
			? `<${index}/>`
			: `<${index}>${content}</${index}>`;
	}

	const index = context.valueIndex++;
	context.values[String(index)] = child;

	return `{${index}}`;
}

i18next.use(LanguageDetector).use(initReactI18next).init({
	resources,
	fallbackLng: 'en',
	supportedLngs: [...supportedLanguages],
	detection: {
		order: ['localStorage', 'navigator'],
		caches: ['localStorage'],
		lookupLocalStorage: '@@restreamer-ui@@language',
		convertDetectedLanguage: normalizeLanguage,
	},
	interpolation: {
		escapeValue: false,
		prefix: '{',
		suffix: '}',
	},
});

export const i18n = {
	get locale() {
		return i18next.language;
	},
	activate(language: string) {
		return i18next.changeLanguage(language);
	},
	_(message: string | MessageDescriptor) {
		if (typeof message === 'string') {
			return translate(message);
		}

		return translate(message.id, message.values);
	},
	number(value: number, options: Intl.NumberFormatOptions = {}) {
		return new Intl.NumberFormat(i18next.language, options).format(value);
	},
};

export function t(
	strings: TemplateStringsArray,
	...values: unknown[]
): MessageDescriptor {
	const id = strings.reduce((message, part, index) => {
		if (index === 0) {
			return part;
		}

		return `${message}{${index - 1}}${part}`;
	}, '');

	return {
		id,
		values: values.reduce<Record<string, unknown>>((all, value, index) => {
			all[String(index)] = value;
			return all;
		}, {}),
	};
}

export function useLingui() {
	useTranslation();

	return { i18n };
}

export function Trans(props: { children?: React.ReactNode }) {
	useTranslation();

	const context: TranslationContext = {
		components: [],
		values: {},
		valueIndex: 0,
		componentIndex: 0,
	};
	const id = normalizeMessage(serializeChild(props.children, context));
	const message = translate(id, context.values);
	const children = renderTranslatedMessage(
		message,
		context.components,
		context.values,
	);

	return <React.Fragment>{children}</React.Fragment>;
}

export default function I18nProvider(props: { children?: React.ReactNode }) {
	return <I18nextProvider i18n={i18next}>{props.children}</I18nextProvider>;
}
