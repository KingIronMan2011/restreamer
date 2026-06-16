import Hls from 'hls.js/light';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import '../../misc/Player/plyr-skin.css';

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
	color?: {
		seekbar?: string;
		buttons?: string;
	};
	license?: {
		license?: string;
		title?: string;
		author?: string;
	};
};

declare global {
	interface Window {
		playerConfig?: PlayerConfig;
		RestreamerPlyr: {
			createPlayer: (options?: PlayerOptions) => Plyr | null;
			createPlayersitePlayer: (options?: PlayerOptions) => Plyr | null;
		};
	}
}

const licenses: Record<string, { name: string; url: string }> = {
	'CC0 1.0': {
		name: 'CC0 1.0 Universal',
		url: 'https://creativecommons.org/publicdomain/zero/1.0/',
	},
	'CC BY 4.0': {
		name: 'CC BY 4.0',
		url: 'https://creativecommons.org/licenses/by/4.0/',
	},
	'CC BY-SA 4.0': {
		name: 'CC BY-SA 4.0',
		url: 'https://creativecommons.org/licenses/by-sa/4.0/',
	},
	'CC BY-ND 4.0': {
		name: 'CC BY-ND 4.0',
		url: 'https://creativecommons.org/licenses/by-nd/4.0/',
	},
	'CC BY-NC 4.0': {
		name: 'CC BY-NC 4.0',
		url: 'https://creativecommons.org/licenses/by-nc/4.0/',
	},
	'CC BY-NC-SA 4.0': {
		name: 'CC BY-NC-SA 4.0',
		url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
	},
	'CC BY-NC-ND 4.0': {
		name: 'CC BY-NC-ND 4.0',
		url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
	},
};

function currentPlayerConfig(): PlayerConfig {
	return window.playerConfig ?? {};
}

function canPlayNativeHls(video: HTMLVideoElement) {
	return (
		video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
		video.canPlayType('application/x-mpegURL') !== ''
	);
}

function resolvePublicPath(path = '') {
	if (/^https?:\/\//.test(path)) {
		return path;
	}

	return `${window.location.origin}/${path.replace(/^\/+/, '')}`;
}

function logoClassName(position = 'top-left') {
	return `rs-plyr-logo rs-plyr-logo-${position}`;
}

function addLogoOverlay(player: Plyr) {
	const logo = currentPlayerConfig().logo;
	const container = player.elements.container;

	if (!logo?.image || !container) {
		return;
	}

	const img = document.createElement('img');
	img.alt = '';
	img.src = `${resolvePublicPath(logo.image)}?${Math.random()}`;

	const wrapper = logo.link
		? document.createElement('a')
		: document.createElement('div');
	wrapper.className = logoClassName(logo.position);

	if (logo.link) {
		wrapper.setAttribute('href', logo.link);
		wrapper.setAttribute('target', '_blank');
		wrapper.setAttribute('rel', 'noreferrer');
	}

	wrapper.appendChild(img);
	container.appendChild(wrapper);
}

function addLicenseOverlay(player: Plyr) {
	const license = currentPlayerConfig().license?.license;
	const container = player.elements.container;

	if (!license || license === 'none' || !container || !licenses[license]) {
		return;
	}

	const link = document.createElement('a');
	link.className = 'rs-plyr-license';
	link.href = licenses[license].url;
	link.target = '_blank';
	link.rel = 'noreferrer';
	link.textContent = licenses[license].name;

	container.appendChild(link);
}

function attachSource(video: HTMLVideoElement, source: string) {
	if (Hls.isSupported()) {
		const hls = new Hls();
		hls.loadSource(source);
		hls.attachMedia(video);
		return hls;
	}

	if (canPlayNativeHls(video)) {
		video.src = source;
	}

	return null;
}

function create(options: PlayerOptions = {}) {
	const playerConfig = currentPlayerConfig();
	const playerId = options.playerId ?? 'player';
	const video = document.getElementById(playerId) as HTMLVideoElement | null;

	if (!video) {
		return null;
	}

	const autoplay = options.autoplay ?? false;
	const muted = options.mute ?? false;
	const airplay = options.airplay ?? Boolean(playerConfig.airplay);
	const chromecast = options.chromecast ?? Boolean(playerConfig.chromecast);

	if (chromecast) {
		console.warn('Chromecast is not supported by the Plyr player yet.');
	}

	const source = resolvePublicPath(playerConfig.source);
	const poster = resolvePublicPath(playerConfig.poster);
	const primaryColor =
		playerConfig.color?.seekbar || playerConfig.color?.buttons || '#eaea05';

	video.muted = muted;
	video.poster = `${poster}?t=${String(Date.now())}`;

	const hls = attachSource(video, source);
	const controls = [
		'play-large',
		'play',
		'progress',
		'current-time',
		'mute',
		'volume',
		...(airplay ? ['airplay'] : []),
		'fullscreen',
	];

	const player = new Plyr(video, {
		autoplay,
		controls,
		muted,
		ratio: '16:9',
		storage: { enabled: false },
	});

	player.elements.container?.classList.add('rs-plyr', 'rs-plyr-public');
	player.elements.container?.style.setProperty(
		'--rs-player-primary',
		primaryColor,
	);

	player.once('destroy', () => {
		hls?.destroy();
	});

	addLogoOverlay(player);
	addLicenseOverlay(player);

	if (autoplay) {
		void player.play();
	}

	return player;
}

window.RestreamerPlyr = {
	createPlayer: create,
	createPlayersitePlayer: create,
};
