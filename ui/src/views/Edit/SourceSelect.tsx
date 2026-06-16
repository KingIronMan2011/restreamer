// @ts-nocheck
import React from 'react';
import SemverSatisfies from 'semver/functions/satisfies';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Trans } from '@lingui/macro';

import Sources from './Sources';

function initConfig(initialConfig) {
	let config = {};

	for (const s of Sources.List()) {
		config[s.id] = {};
	}

	config = {
		...config,
		...initialConfig,
	};

	return config;
}

function init(source) {
	const settings = {};

	for (const id of Sources.IDs()) {
		settings[id] = {};
	}

	settings[source.type] = source.settings;

	return settings;
}

function reducer(settings, data) {
	const newSettings = {
		...settings,
		...data,
	};

	return newSettings;
}

export default function SourceSelect(props) {
	const {
		type = '',
		skills = {},
		source = {},
		config: _config = {},
		onProbe = function (type, device, settings, inputs) {},
		onSelect = function (type, device) {},
		onChange = function (type, device, settings) {},
		onRefresh = function () {},
		onStore = function (name, data) {},
	} = props;
	// $source holds the currently selected device. It is initialized with the
	// last stored source.
	const [$source, setSource] = React.useState(source.type);

	// $settings is for storing the settings of the different devices, such that if
	// the user switches between them, they can be restored. It takes the last
	// stored source settings as initial value.
	const [$settings, setSettings] = React.useReducer(reducer, source, init);

	const config = initConfig(_config);

	const handleSource = (source) => {
		onChange(type);
		setSource(source);

		onSelect(type, source);
	};

	const handleRefresh = async () => {
		await onRefresh();
	};

	const handleStore = async (name, data) => {
		return await onStore(name, data);
	};

	const handleProbe = async (settings, inputs) => {
		await onProbe(type, $source, settings, inputs);
	};

	const handleChange = (source) => (settings) => {
		setSettings({
			...$settings,
			[source]: settings,
		});

		onChange(type, source, settings);
	};

	let sourceControl = null;

	const s = Sources.Get($source);
	if (s !== null) {
		const Component = s.component;

		if (SemverSatisfies(skills.ffmpeg.version, s.ffversion)) {
			sourceControl = (
				<Component
					knownDevices={skills.sources[$source]}
					skills={skills}
					config={config[$source]}
					settings={$settings[$source]}
					onChange={handleChange($source)}
					onProbe={handleProbe}
					onRefresh={handleRefresh}
					onStore={handleStore}
				/>
			);
		}
	}

	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Select
					type={type}
					selected={$source}
					ffversion={skills.ffmpeg.version}
					availableSources={skills.sources}
					onSelect={handleSource}
				/>
			</Grid>
			<Grid item xs={12}>
				{sourceControl}
			</Grid>
		</Grid>
	);
}

function Select(props) {
	const {
		type = '',
		selected = '',
		ffversion = '0.0.0',
		availableSources: _availableSources = {},
		onSelect = function (source) {},
	} = props;
	const handleSource = (source) => () => {
		onSelect(source);
	};

	const availableSources = [];

	for (const s of Sources.List()) {
		if (!(s.id in _availableSources)) {
			continue;
		}

		if (!s.capabilities.includes(type)) {
			continue;
		}

		if (!SemverSatisfies(ffversion, s.ffversion)) {
			continue;
		}

		const variant = s.id === selected ? 'bigSelected' : 'big';
		const Icon = s.icon;

		availableSources.push(
			<Grid item xs={6} md={4} align="center" key={s.id}>
				<Button variant={variant} onClick={handleSource(s.id)}>
					<div>
						<Icon />
						<Typography>{s.name}</Typography>
					</div>
				</Button>
			</Grid>,
		);
	}

	if (availableSources.length === 0) {
		return (
			<Grid container spacing={1}>
				<Grid item xs={12}>
					<Typography variant="body1">
						<Trans>No sources available</Trans>
					</Typography>
				</Grid>
			</Grid>
		);
	}

	return (
		<Grid container spacing={1}>
			{availableSources}
		</Grid>
	);
}
