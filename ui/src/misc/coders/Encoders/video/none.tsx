import React from 'react';

import Helper from '../../helper';

function createMapping(settings, stream, skills) {
	stream = Helper.InitStream(stream);
	skills = Helper.InitSkills(skills);

	const local = ['-vn'];

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

const coder = 'none';
const name = 'No Video';
const codec = 'none';
const type = 'video';
const hwaccel = false;

function summarize(settings) {
	return `${name}`;
}

function defaults(stream, skills) {
	const settings = {};

	return {
		settings: settings,
		mapping: createMapping(settings, stream, skills),
	};
}

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
