import React from 'react';

import makeStyles from '../compat/mui-styles/makeStyles';
import Grid from '@mui/material/Grid';
import type { ReactNode } from 'react';

type ComponentProps = {
	children?: ReactNode;
};

const useStyles = makeStyles((theme) => ({
	grid: {
		flexGrow: '1',
		display: 'flex',
		height: '100%',
	},
}));

export default function Component(props: ComponentProps) {
	const { children = null } = props;
	const classes = useStyles();

	return (
		<Grid item xs={12} className={classes.grid}>
			{children}
		</Grid>
	);
}
