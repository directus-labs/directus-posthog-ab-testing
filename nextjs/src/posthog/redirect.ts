import type { PostHogFlags } from "./types";

export function checkForRedirect(pathname: string | null, flags: PostHogFlags): string | null {
	if (!pathname || !flags.featureFlags || !flags.featureFlagPayloads) return null;

	let redirectPath: string | null = null;

	Object.entries(flags.featureFlags).forEach(([key, value]) => {
		const payload = flags.featureFlagPayloads[key];

		const isPageExperiment = payload?.experiment_type === 'page';
		const isOnControlPath = pathname === payload?.control_path;
		const hasAlternativePath = payload?.control_path !== payload?.path;
		const isInTestGroup = value !== 'control';
		const isNotAlreadyOnTestPath = pathname !== payload?.path;

		if (isPageExperiment && isOnControlPath && hasAlternativePath && isInTestGroup && isNotAlreadyOnTestPath) {
			redirectPath = payload.path!;
		}
	});

	return redirectPath;
}
