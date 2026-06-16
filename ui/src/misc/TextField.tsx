import React from 'react';

import { v4 as uuidv4 } from 'uuid';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import type { OutlinedInputProps } from '@mui/material/OutlinedInput';

import Env from './Env';

type ComponentProps = Omit<OutlinedInputProps, 'label'> & {
	env?: boolean;
	helperText?: React.ReactNode;
	label?: React.ReactNode;
	fullWidth?: boolean;
	max?: string | number;
	min?: string | number;
	readOnly?: boolean;
	step?: string | number;
	variant?: string;
};

export default function Component(props: ComponentProps) {
	const {
		id: _id = null,
		label = '',
		value = '',
		disabled = false,
		multiline = false,
		rows = 1,
		env = false,
		type = 'text',
		helperText = null,
		onChange = function (value) {},
	} = props;
	const id = _id === null ? uuidv4() : _id;
	let adornment = null;

	if (env) {
		adornment = (
			<InputAdornment position="end">
				<Env />
			</InputAdornment>
		);
	}

	return (
		<FormControl variant="outlined" disabled={disabled} fullWidth>
			<InputLabel htmlFor={id}>{label}</InputLabel>
			<OutlinedInput
				id={id}
				value={value}
				onChange={onChange}
				endAdornment={adornment}
				label={label}
				multiline={multiline}
				rows={rows}
				type={type}
				inputProps={{
					min: props.min,
					max: props.max,
					step: props.step,
					...(props.inputProps ?? {}),
				}}
				readOnly={props.readOnly}
			/>
			{helperText && <FormHelperText>{helperText}</FormHelperText>}
		</FormControl>
	);
}
