import React from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import logo from '../assets/images/index_icon.svg';

export default function Landing() {
	return (
		<Box
			sx={{
				width: '100%',
				height: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				bgcolor: 'rgb(26,26,26)',
			}}
		>
			<Box
				sx={{
					width: 350,
					bgcolor: 'rgba(56, 56, 56, 0.95)',
					borderRadius: '15px',
					textAlign: 'center',
					p: 0,
					overflow: 'hidden',
				}}
			>
				<Box
					component="img"
					src={logo}
					alt="datarhei Restreamer logo"
					sx={{ width: 285, height: 190, mt: '30px' }}
				/>
				<Typography sx={{ color: '#fff', padding: '10px 20px 20px' }}>
					An easy to use video server and framework for video streaming.
				</Typography>
				<Box sx={{ borderTop: '1px solid rgba(0,0,0,.25)', pt: 2, pb: 2 }}>
					<Link href="/ui/" sx={{ color: '#fff' }}>
						Did you mean to go to the admin panel?
					</Link>
				</Box>
			</Box>
		</Box>
	);
}
