import React from 'react';

import makeStyles from '../compat/mui-styles/makeStyles';
import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import type { HTMLAttributes, ReactNode } from 'react';

type TabPanelProps = HTMLAttributes<HTMLDivElement> & {
	children?: ReactNode;
	index: any;
	value: any;
};

const useStyles = makeStyles((theme) => ({
	root: {
		padding: 0,
	},
	'& .MuiBox-root': {
		padding: 0,
	},
}));

export default function TabPanel(props: TabPanelProps) {
	const classes = useStyles();
	const { children, value, index, ...other } = props;

	return (
		<div
			className={classes.root}
			role="tabpanel"
			hidden={value !== index}
			id={`vertical-tabpanel-${index}`}
			{...other}
		>
			{value === index && (
				<Box className={classes.root} sx={{ p: 0 }}>
					{children}
				</Box>
			)}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.any.isRequired,
	value: PropTypes.any.isRequired,
};
