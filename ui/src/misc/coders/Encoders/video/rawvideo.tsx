import React from 'react';

import Helper from '../../helper';

function createMapping(settings, stream, skills) {
	stream = Helper.InitStream(stream);
	skills = Helper.InitSkills(skills);

	const local = ['-codec:v', 'rawvideo'];

	const mapping = {
		global: [],
		local: local,
		filter: [],
	};

	return mapping;
}

function Coder(props) {
	const {
		stream: _stream = {},
		settings: _settings = {},
		skills: _skills = {},
		onChange = function (settings, mapping) {},
	} = props;
	const settings = {};
	const stream = Helper.InitStream(_stream);
	const skills = Helper.InitSkills(_skills);

	const handleChange = (newSettings) => {
		let automatic = false;
		if (!newSettings) {
			newSettings = settings;
			automatic = true;
		}

		onChange(
			newSettings,
			createMapping(newSettings, stream, skills),
			automatic,
		);
	};

	React.useEffect(() => {
		handleChange(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return null;
}

function summarize(settings) {
	return `${name}`;
}

function defaults(stream, skills) {
	return {
		settings: {},
		mapping: createMapping({}, stream, skills),
	};
}

const coder = 'rawvideo';
const name = 'RAWVIDEO';
const codec = 'rawvideo';
const type = 'video';
const hwaccel = false;

export {
	coder,
	name,
	codec,
	type,
	hwaccel,
	summarize,
	defaults,
	Coder as component,
};
