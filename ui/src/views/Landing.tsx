import React from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import logo from '../assets/images/index_icon.svg';

export default function Landing(): React.JSX.Element {
	return (
		<Box
			sx={{
				width: '100%',
				height: '100vh',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				bgcolor: 'background.button_disabled',
			}}
		>
			<Box
				sx={{
					width: 350,
					bgcolor: 'background.paper',
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
				<Typography
					sx={{ color: 'text.primary', padding: '10px 20px 20px' }}
				>
					An easy to use video server and framework for video
					streaming.
				</Typography>
				<Box
					sx={{
						borderTop: 1,
						borderColor: 'background.dark2',
						pt: 2,
						pb: 2,
					}}
				>
					<Link href="/ui/" sx={{ color: 'common.white' }}>
						Did you mean to go to the admin panel?
					</Link>
				</Box>
			</Box>
		</Box>
	);
}
