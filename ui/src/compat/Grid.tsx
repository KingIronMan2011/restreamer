// @ts-nocheck
// Compatibility shim: translates MUI v5/v6 Grid props (item, xs, sm, md, lg, xl)
// to the MUI v9 Grid API (size, offset). Drop-in replacement via Vite alias.
import * as React from 'react';
import { Grid as MuiGrid } from '@mui/material';

const Grid = React.forwardRef(function Grid(props: any, ref: any) {
	const {
		xs,
		sm,
		md,
		lg,
		xl,
		item: _item,
		zeroMinWidth: _zeroMinWidth,
		wrap: _wrap,
		...rest
	} = props;

	const hasSizeProps =
		xs !== undefined ||
		sm !== undefined ||
		md !== undefined ||
		lg !== undefined ||
		xl !== undefined;

	if (!hasSizeProps) {
		return <MuiGrid ref={ref} {...rest} />;
	}

	const sizeMap: Record<string, any> = {};
	if (xs !== undefined) sizeMap.xs = xs;
	if (sm !== undefined) sizeMap.sm = sm;
	if (md !== undefined) sizeMap.md = md;
	if (lg !== undefined) sizeMap.lg = lg;
	if (xl !== undefined) sizeMap.xl = xl;

	const keys = Object.keys(sizeMap);
	const size =
		keys.length === 1 && 'xs' in sizeMap ? sizeMap.xs : sizeMap;

	return <MuiGrid ref={ref} size={size} {...rest} />;
});

export default Grid;
