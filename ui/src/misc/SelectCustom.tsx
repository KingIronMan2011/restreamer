import React from 'react';

import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';

function isCustomOption(value, options) {
	for (const o of options) {
		if (o.value === value) {
			return false;
		}
	}

	return true;
}

export default function Component(props) {
	const {
		variant = 'outlined',
		label = '',
		value = '',
		disabled = false,
		customKey = 'custom',
		allowCustom = false,
		onChange = function (event) {},
	} = props;
	const [$value, setValue] = React.useState<any>({
		value: value,
		isCustom: isCustomOption(value, props.options),
		custom: isCustomOption(value, props.options) === true ? value : '',
	});

	const handleChange = (event) => {
		const v = event.target.value;

		const value = $value;

		value.isCustom = v === customKey ? true : false;
		if (value.isCustom === true) {
			value.custom = value.value;
		}
		value.value = v;

		setValue({
			...$value,
			value: v,
			isCustom: v === customKey ? true : false,
		});

		onChange({
			target: {
				value: v === customKey ? value.custom : value.value,
			},
		});
	};

	const handleCustomChange = (event) => {
		setValue({
			...$value,
			custom: event.target.value,
		});

		onChange(event);
	};

	const options = [];

	for (const o of props.options) {
		options.push(
			<MenuItem
				key={o.value}
				value={o.value}
				disabled={o.disabled === true}
			>
				{o.label}
			</MenuItem>,
		);
	}

	return (
		<Grid container spacing={2}>
			{allowCustom === true ? (
				<React.Fragment>
					{$value.isCustom === true ? (
						<React.Fragment>
							<Grid item xs={6}>
								<FormControl variant={variant} fullWidth>
									<InputLabel>{label}</InputLabel>
									<Select
										value={
											$value.isCustom === false
												? $value.value
												: customKey
										}
										onChange={handleChange}
										disabled={disabled}
										label={label}
									>
										{options}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={6}>
								<TextField
									variant={variant}
									fullWidth
									disabled={
										disabled === true ||
										$value.isCustom === false
									}
									label={
										props.customLabel
											? props.customLabel
											: label
									}
									value={$value.custom}
									onChange={handleCustomChange}
								/>
							</Grid>
						</React.Fragment>
					) : (
						<Grid item xs={12}>
							<FormControl variant={variant} fullWidth>
								<InputLabel>{label}</InputLabel>
								<Select
									value={
										$value.isCustom === false
											? $value.value
											: customKey
									}
									onChange={handleChange}
									disabled={disabled}
									label={label}
								>
									{options}
								</Select>
							</FormControl>
						</Grid>
					)}
				</React.Fragment>
			) : (
				<Grid item xs={12}>
					<FormControl variant={variant} fullWidth>
						<InputLabel>{label}</InputLabel>
						<Select
							value={$value.value}
							onChange={handleChange}
							disabled={disabled}
							label={label}
						>
							{options}
						</Select>
					</FormControl>
				</Grid>
			)}
		</Grid>
	);
}
