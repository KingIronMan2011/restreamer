import React from 'react';

import Stack from '@mui/material/Stack';

import Hls from 'hls.js/light';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import './plyr-skin.css';

type PlayerLogo = {
	image?: string;
	position?: string;
	link?: string;
};

type PlayerColors = {
	seekbar?: string;
	buttons?: string;
};

type PlayerProps = {
	source: string;
	poster?: string;
	controls?: boolean;
	autoplay?: boolean;
	mute?: boolean;
	type?: string;
	logo?: PlayerLogo;
	colors?: PlayerColors;
	airplay?: boolean;
	onReady?: (player: Plyr) => void;
};

function canPlayNativeHls(video: HTMLVideoElement) {
	return (
		video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
		video.canPlayType('application/x-mpegURL') !== ''
	);
}

function logoClassName(position = 'top-left') {
	return `rs-plyr-logo rs-plyr-logo-${position}`;
}

export default function PlyrPlayer(props: PlayerProps) {
	const {
		source,
		poster = '',
		controls = false,
		autoplay = false,
		mute = false,
		type = 'plyr-internal',
		logo = {},
		colors = {},
		airplay = false,
		onReady,
	} = props;
	const videoRef = React.useRef<HTMLVideoElement | null>(null);
	const playerRef = React.useRef<Plyr | null>(null);
	const hlsRef = React.useRef<Hls | null>(null);

	React.useEffect(() => {
		const video = videoRef.current;
		if (!video) {
			return;
		}

		if (poster) {
			video.poster = poster;
		}

		video.muted = Boolean(mute);

		if (Hls.isSupported()) {
			const hls = new Hls();
			hls.loadSource(source);
			hls.attachMedia(video);
			hlsRef.current = hls;
		} else if (canPlayNativeHls(video)) {
			video.src = source;
		}

		const plyrControls = controls
			? [
					'play-large',
					'play',
					'progress',
					'current-time',
					'mute',
					'volume',
					...(airplay ? ['airplay'] : []),
					'fullscreen',
				]
			: [];

		const player = new Plyr(video, {
			autoplay,
			controls: plyrControls,
			muted: Boolean(mute),
			ratio: '16:9',
			storage: { enabled: false },
		});

		playerRef.current = player;
		onReady?.(player);

		if (autoplay) {
			void player.play();
		}

		return () => {
			player.destroy();
			playerRef.current = null;

			hlsRef.current?.destroy();
			hlsRef.current = null;
		};
	}, [airplay, autoplay, controls, mute, onReady, poster, source]);

	const primaryColor = colors.seekbar || colors.buttons || '#eaea05';
	const logoElement = logo.image ? (
		logo.link ? (
			<a
				className={logoClassName(logo.position)}
				href={logo.link}
				target="_blank"
				rel="noreferrer"
			>
				<img src={logo.image} alt="" />
			</a>
		) : (
			<div className={logoClassName(logo.position)}>
				<img src={logo.image} alt="" />
			</div>
		)
	) : null;

	return (
		<Stack
			className={`rs-plyr rs-plyr-${type}`}
			direction="column"
			justifyContent="center"
			alignItems="center"
			spacing={0}
			style={
				{
					'--rs-player-primary': primaryColor,
					position: 'absolute',
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
				} as React.CSSProperties
			}
		>
			<video ref={videoRef} controls={controls} playsInline />
			{logoElement}
		</Stack>
	);
}
