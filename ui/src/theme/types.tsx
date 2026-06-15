import type React from 'react';
import type { Theme } from '@mui/material/styles';

declare global {
	interface ObjectConstructor {
		values(o: any): any[];
		entries(o: any): [string, any][];
	}
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

	interface GridBaseProps {
		align?: React.CSSProperties['textAlign'];
		alignItems?: React.CSSProperties['alignItems'];
		justifyContent?: React.CSSProperties['justifyContent'];
		item?: boolean;
		marginTop?: number | string;
		padding?: number | string | Record<string, number | string>;
		textAlign?: React.CSSProperties['textAlign'];
		xs?: boolean | number | string;
		sm?: boolean | number | string;
		md?: boolean | number | string;
		lg?: boolean | number | string;
		xl?: boolean | number | string;
	}
}

declare module '@mui/material/Stack' {
	interface StackOwnProps {
		alignItems?: React.CSSProperties['alignItems'];
		justifyContent?: React.CSSProperties['justifyContent'];
		width?: React.CSSProperties['width'];
	}
}

declare module '@mui/material/Popover' {
	interface PopoverProps {
		PaperProps?: Record<string, any>;
	}
}

declare module '@mui/material/SwipeableDrawer' {
	interface SwipeableDrawerProps {
		BackdropProps?: Record<string, any>;
	}
}

declare module '@mui/material/TextField' {
	interface BaseTextFieldProps {
		inputProps?: Record<string, any>;
	}
}

declare module '@mui/material/Typography' {
	interface TypographyOwnProps {
		textAlign?: React.CSSProperties['textAlign'];
		width?: React.CSSProperties['width'];
	}
}

declare module '@mui/material/Box' {
	interface BoxOwnProps<Theme extends object = any> {
		p?: number | string;
	}
}

declare module 'react' {
	interface ForwardRefExoticComponent<P> {
		defaultProps?: Partial<P>;
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
