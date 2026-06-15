import type React from 'react';

export default function withStyles(_styles: unknown) {
	return function withStylesWrapper<ComponentProps>(
		Component: React.ComponentType<ComponentProps>,
	) {
		return Component;
	};
}
