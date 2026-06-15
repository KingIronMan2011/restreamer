import React from 'react';

import makeStyles from '../compat/mui-styles/makeStyles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import type { PaperProps } from '@mui/material/Paper';

type ComponentProps = PaperProps & {
	marginBottom?: string | number;
	xs?: number;
	sm?: number;
	md?: number;
	lg?: number;
	className?: string;
};

const useStyles = makeStyles((theme) => ({
	PaperM: {
		padding: '3em 3.5em 3em 3.5em!important',
	},
	PaperL: {
		padding: '4em 4.5em 4em 4.5em!important',
	},
	PaperService: {
		padding: '4em 4.5em 4em 4.5em!important',
		border: `1px solid ${theme.palette.background.light1}`,
		backgroundColor: theme.palette.service.contrastText,
	},
}));

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
	(props, ref) => {
		const classes = useStyles();
		let { marginBottom, xs, sm, md, lg, className, elevation, ...other } =
			props;

		elevation = 0;

		return (
			<Grid
				container
				justifyContent="center"
				spacing={1}
				style={{ marginBottom: marginBottom }}
			>
				<Grid item xs={xs} sm={sm} md={md} lg={lg}>
					<Paper
						className={classes[className]}
						elevation={elevation}
						ref={ref}
						{...other}
					>
						{props.children}
					</Paper>
				</Grid>
			</Grid>
		);
	},
);

export default Component;

Component.defaultProps = {
	marginBottom: '6em',
	xs: 12,
	sm: undefined,
	md: undefined,
	lg: undefined,
	elevation: 0,
	className: 'paper',
};
