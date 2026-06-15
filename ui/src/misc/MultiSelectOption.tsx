import React from 'react';

import makeStyles from '../compat/mui-styles/makeStyles';
import MenuItem from '@mui/material/MenuItem';
import type { MenuItemProps } from '@mui/material/MenuItem';

type ComponentProps = MenuItemProps & {
	name?: React.ReactNode;
	selected?: boolean;
	value?: string | number;
};

const useStyles = makeStyles((theme) => ({
	root: {
		fontWeight: 'bold',
		backgroundColor: theme.palette.background.dark1,
	},
}));

const Component = React.forwardRef<HTMLLIElement, ComponentProps>(
	(props, ref) => {
		const classes = useStyles();

		const { name, value, selected, ...other } = props;

		return (
			<MenuItem
				value={props.value}
				className={props.selected ? classes.root : ''}
				ref={ref}
				{...other}
			>
				{props.name}
			</MenuItem>
		);
	},
);

export default Component;

Component.defaultProps = {
	name: '',
	value: '',
	selected: false,
};
