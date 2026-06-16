import React from 'react';

import PlyrPlayer from './plyr';

export default function Player(props) {
	const {
		type: _type = 'plyr-internal',
		source = '',
		poster = '',
		controls = false,
		autoplay = false,
		mute = false,
		logo = {
			image: '',
			position: 'top-right',
			link: '',
		},
		colors = {
			seekbar: '#fff',
			buttons: '#fff',
		},
		airplay = false,
	} = props;
	const type = _type ? _type : 'plyr-internal';

	if (type === 'plyr-internal' || type === 'plyr-public') {
		const isInternal = type === 'plyr-internal';
		const shouldAutoplay = isInternal ? true : autoplay && mute === 'muted';

		return (
			<PlyrPlayer
				type={type}
				source={source}
				poster={poster}
				controls={controls}
				autoplay={shouldAutoplay}
				mute={isInternal ? true : mute === 'muted' || mute === true}
				logo={logo}
				colors={colors}
				airplay={airplay}
			/>
		);
	}
}
