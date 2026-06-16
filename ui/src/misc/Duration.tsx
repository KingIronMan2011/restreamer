import React from 'react';

export default function Duration(props) {
	const { seconds = 0 } = props;
	const fullSeconds = Math.floor(seconds);
	const s = fullSeconds % 60;
	const m = Math.floor(fullSeconds / 60) % 60;
	const h = Math.floor(fullSeconds / (60 * 60)) % 24;
	const d = Math.floor(fullSeconds / (60 * 60 * 24));

	let duration = '.' + ((seconds - fullSeconds) * 100).toFixed(0);

	if (s < 10) {
		duration = ':0' + s + duration;
	} else {
		duration = ':' + s + duration;
	}

	if (m < 10) {
		duration = ':0' + m + duration;
	} else {
		duration = ':' + m + duration;
	}

	if (h < 10) {
		duration = '0' + h + duration;
	} else {
		duration = '' + h + duration;
	}

	if (d !== 0) {
		duration = d + ':' + duration;
	}

	return <React.Fragment>{duration}</React.Fragment>;
}
