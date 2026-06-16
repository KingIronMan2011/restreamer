import React from 'react';

import TextareaModal from './Textarea';

const Component = function (props) {
	const {
		open = false,
		data = '',
		title = '',
		onClose = null,
		onHelp = null,
	} = props;
	return (
		<TextareaModal
			open={open}
			title={title}
			onClose={onClose}
			onHelp={onHelp}
			rows={18}
			value={data}
			readOnly
			allowCopy
		/>
	);
};

export default Component;
