import React from 'react';

import Grid from '@mui/material/Grid';

const Component = function (props) {
	const { spacing = 3, textAlign = 'left' } = props;
	return (
		<Grid
			container
			justifyContent="center"
			spacing={spacing}
			align={textAlign}
		>
			<Grid item xs={12}>
				{props.children}
			</Grid>
		</Grid>
	);
};

export default Component;
