import videojs from 'video.js';
import 'videojs-overlay';

import 'video.js/dist/video-js.min.css';
import '../../../node_modules/videojs-overlay/dist/videojs-overlay.css';
import '../../misc/Player/video-js-skin-public.min.css';
import './videojs-license.min.css';
import './videojs-airplay.min.css';
import './videojs-chromecast.min.css';

import licensePlugin from './videojs-license.min.js?raw';
import airplayPlugin from './videojs-airplay.min.js?raw';
import chromecastPlugin from './videojs-chromecast.min.js?raw';

type PlayerOptions = {
	playerId?: string;
	autoplay?: boolean;
	mute?: boolean;
	chromecast?: boolean;
	airplay?: boolean;
};

type PlayerConfig = {
	poster?: string;
	source?: string;
	chromecast?: boolean;
	airplay?: boolean;
	logo?: {
		image?: string;
		link?: string;
		position?: string;
	};
	license?: unknown;
};

declare global {
	interface Window {
		playerConfig?: PlayerConfig;
		videojs?: unknown;
		RestreamerVideoJS: {
			createPlayer: (options?: PlayerOptions) => unknown;
			createPlayersitePlayer: (options?: PlayerOptions) => unknown;
		};
	}
}

const videojsRuntime = videojs as any;

window.videojs = videojsRuntime;

function runPluginSource(source: string) {
	const script = document.createElement('script');
	script.text = source;
	document.head.appendChild(script);
	script.remove();
}

runPluginSource(licensePlugin);
runPluginSource(airplayPlugin);
runPluginSource(chromecastPlugin);

function currentPlayerConfig(): PlayerConfig {
	return window.playerConfig ?? {};
}

function buildConfig(options: Required<PlayerOptions>) {
	const playerConfig = currentPlayerConfig();
	const plugins: Record<string, unknown> = {};
	const source = playerConfig.source ?? '';

	const config: Record<string, unknown> = {
		controls: true,
		poster: `${playerConfig.poster ?? ''}?t=${String(Date.now())}`,
		autoplay: options.autoplay ? 'muted' : false,
		muted: options.mute,
		liveui: true,
		responsive: true,
		fluid: true,
		sources: [
			{
				src: `${window.location.origin}/${source}`,
				type: 'application/x-mpegURL',
			},
		],
		plugins,
	};

	if (options.chromecast) {
		config.techOrder = ['chromecast', 'html5'];
		plugins.chromecast = {
			receiverApplicationId: 'CC1AD845',
		};
	}

	if (options.airplay) {
		plugins.airPlay = {};
	}

	return config;
}

function addLogoOverlay(player: any) {
	const playerConfig = currentPlayerConfig();
	const logo = playerConfig.logo;

	if (!logo?.image || typeof player.overlay !== 'function') {
		return;
	}

	let overlay = '';
	const imgTag = new Image();

	imgTag.onload = function () {
		imgTag.setAttribute('width', String(imgTag.naturalWidth));
		imgTag.setAttribute('height', String(imgTag.naturalHeight));
	};
	imgTag.src = `${logo.image}?${Math.random()}`;

	if (logo.link) {
		const aTag = document.createElement('a');
		aTag.setAttribute('href', logo.link);
		aTag.setAttribute('target', '_blank');
		aTag.appendChild(imgTag);
		overlay = aTag.outerHTML;
	} else {
		overlay = imgTag.outerHTML;
	}

	player.overlay({
		align: logo.position ?? 'top-left',
		overlays: [
			{
				showBackground: false,
				content: overlay,
				start: 'playing',
				end: 'pause',
			},
		],
	});
}

function setupPlayer(player: any, options: Required<PlayerOptions>) {
	const playerConfig = currentPlayerConfig();

	player.ready(() => {
		if (options.chromecast && typeof player.chromecast === 'function') {
			player.chromecast();
		}

		if (options.airplay && typeof player.airPlay === 'function') {
			player.airPlay();
		}

		if (typeof player.license === 'function') {
			player.license(playerConfig.license);
		}

		addLogoOverlay(player);

		if (options.autoplay === true && typeof player.play === 'function') {
			void player.play();
		}
	});
}

function create(options: PlayerOptions = {}) {
	const playerConfig = currentPlayerConfig();
	const normalizedOptions: Required<PlayerOptions> = {
		playerId: options.playerId ?? 'player',
		autoplay: options.autoplay ?? false,
		mute: options.mute ?? false,
		chromecast: options.chromecast ?? Boolean(playerConfig.chromecast),
		airplay: options.airplay ?? Boolean(playerConfig.airplay),
	};

	const player = videojsRuntime(
		normalizedOptions.playerId,
		buildConfig(normalizedOptions),
	);
	setupPlayer(player, normalizedOptions);

	return player;
}

window.RestreamerVideoJS = {
	createPlayer: create,
	createPlayersitePlayer: create,
};
