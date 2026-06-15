import * as React from 'react';
import { useTheme } from '@mui/material/styles';

type StyleValue = string | number | undefined | null;
interface StyleRule {
	[key: string]: StyleValue | StyleRule;
}
type Styles = Record<string, StyleRule> | ((theme: any) => Record<string, StyleRule>);

const unitlessProperties = new Set([
	'font-weight',
	'line-height',
	'opacity',
	'z-index',
	'flex',
	'flex-grow',
	'flex-shrink',
	'order',
]);

let counter = 0;

function toKebabCase(value: string) {
	return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function cssValue(property: string, value: StyleValue) {
	if (value === undefined || value === null) {
		return '';
	}

	if (typeof value === 'number' && !unitlessProperties.has(property)) {
		return `${value}px`;
	}

	return String(value);
}

function serializeRule(selector: string, rule: StyleRule) {
	const declarations: string[] = [];
	const nested: string[] = [];

	for (const [rawProperty, rawValue] of Object.entries(rule)) {
		if (
			rawValue !== null &&
			typeof rawValue === 'object' &&
			!Array.isArray(rawValue)
		) {
			if (rawProperty.startsWith('@')) {
				nested.push(
					`${rawProperty}{${serializeRule(selector, rawValue as StyleRule)}}`,
				);
			} else {
				const nestedSelector = rawProperty.includes('&')
					? rawProperty.replaceAll('&', selector)
					: `${selector} ${rawProperty}`;

				nested.push(serializeRule(nestedSelector, rawValue as StyleRule));
			}
			continue;
		}

		const property = toKebabCase(rawProperty);
		const value = cssValue(property, rawValue as StyleValue);

		if (value.length !== 0) {
			declarations.push(`${property}:${value};`);
		}
	}

	return `${selector}{${declarations.join('')}}${nested.join('')}`;
}

function injectStyle(id: number, rules: Record<string, StyleRule>) {
	const elementId = `mui-compat-style-${id}`;
	let element = document.getElementById(elementId);

	if (!element) {
		element = document.createElement('style');
		element.id = elementId;
		document.head.appendChild(element);
	}

	element.textContent = Object.entries(rules)
		.map(([key, rule]) => serializeRule(`.mui-compat-${id}-${key}`, rule))
		.join('');
}

export default function makeStyles(styles: Styles) {
	const id = counter++;

	return function useStyles() {
		const theme = useTheme();
		const rules = React.useMemo(
			() => (typeof styles === 'function' ? styles(theme) : styles),
			[theme],
		);

		React.useEffect(() => {
			injectStyle(id, rules);
		}, [rules]);

		return React.useMemo(
			() =>
				Object.keys(rules ?? {}).reduce<Record<string, string>>(
					(classes, key) => {
						classes[key] = `mui-compat-${id}-${key}`;
						return classes;
					},
					{},
				),
			[rules],
		);
	};
}
