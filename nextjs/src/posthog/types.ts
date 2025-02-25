export interface ExperimentPayload {
	experiment_type: 'page' | 'block';
	control_path?: string;
	path?: string;
}

export interface PostHogFlags {
	featureFlags: Record<string, string>;
	featureFlagPayloads: Record<string, ExperimentPayload>;
}
