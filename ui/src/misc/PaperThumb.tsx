import React from 'react';

import makeStyles from '../compat/mui-styles/makeStyles';
import CardMedia from '@mui/material/CardMedia';

const useStyles = makeStyles((theme) => ({
	media: {
		paddingTop: '39.25%',
		borderRadius: 4,
	},
}));

export default function Component(props) {
	const { image = '', title = '', height = '0px' } = props;
	const classes = useStyles();

	return (
		<CardMedia
			className={classes.media}
			style={{ height: height }}
			image={image}
			title={title}
		/>
	);
}
