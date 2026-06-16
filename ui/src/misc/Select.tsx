import React from 'react';

import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function Component(props) {
	const {
		variant = 'outlined',
		label = '',
		value = '',
		disabled = false,
		onChange = function (event) {},
	} = props;
	return (
		<FormControl variant={variant} fullWidth>
			<InputLabel>{label}</InputLabel>
			<Select
				value={value}
				onChange={onChange}
				disabled={disabled}
				label={label}
				MenuProps={{ disableScrollLock: true }}
			>
				{props.children}
			</Select>
		</FormControl>
	);
}
