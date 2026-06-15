import type React from 'react';
import type { Theme } from '@mui/material/styles';

declare global {
	interface ObjectConstructor {
		values(o: any): any[];
		entries(o: any): [string, any][];
	}
}

declare module '@mui/styles/defaultTheme' {
	interface DefaultTheme extends Theme {}
}

declare module '@mui/material/styles' {
	interface TypeBackground {
		accordion: string;
		accordion_border: string;
		box_default: string;
		box_danger: string;
		button_disabled: string;
		dark1: string;
		dark2: string;
		footer1: string;
		footer2: string;
		light1: string;
		modal: string;
		modalbox: string;
	}

	interface Palette {
		default: Palette['primary'];
		service: Palette['primary'];
		selected: Palette['primary'];
	}

	interface PaletteOptions {
		default?: PaletteOptions['primary'];
		service?: PaletteOptions['primary'];
		selected?: PaletteOptions['primary'];
	}

	interface TypographyVariants {
		body3: React.CSSProperties;
		pagetitle: React.CSSProperties;
	}

	interface TypographyVariantsOptions {
		body3?: React.CSSProperties;
		pagetitle?: React.CSSProperties;
	}
}

declare module '@mui/material/Button' {
	interface ButtonPropsColorOverrides {
		default: true;
		service: true;
		selected: true;
	}

	interface ButtonPropsVariantOverrides {
		big: true;
		bigSelected: true;
		service: true;
	}
}

declare module '@mui/material/Fab' {
	interface FabPropsColorOverrides {
		default: true;
		service: true;
		selected: true;
	}
}

declare module '@mui/material/SvgIcon' {
	interface SvgIconPropsColorOverrides {
		default: true;
		service: true;
		selected: true;
	}

	interface SvgIconOwnProps {
		size?: string;
	}
}

declare module '@mui/material/Typography' {
	interface TypographyPropsVariantOverrides {
		body: true;
		body3: true;
		pagetitle: true;
		subheading: true;
	}
}

declare module '@mui/material/List' {
	interface ListOwnProps {
		size?: string;
	}
}

declare module '@mui/material/ListItem' {
	interface ListItemOwnProps {
		selected?: boolean;
	}
}

declare module '@mui/material/ListItemIcon' {
	interface ListItemIconProps {
		size?: string;
	}
}

declare module '@mui/material/TextField' {
	interface BaseTextFieldProps {
		min?: string | number;
		max?: string | number;
		step?: string | number;
		readOnly?: boolean;
	}
}

declare module '@mui/material/Grid' {
	interface GridOwnProps {
		align?: React.CSSProperties['textAlign'];
	}
}

declare module '@mui/material/AccordionSummary' {
	interface AccordionSummaryOwnProps {
		elevation?: number;
	}
}

declare module '@mui/material/Switch' {
	interface SwitchPropsColorOverrides {
		default: true;
	}
}
