'use client';

import { usePostHog } from 'posthog-js/react';
import { PageBlock } from '@/types/directus-schema';
import BaseBlock from '@/components/blocks/BaseBlock';
import Container from '@/components/ui/container';
import type { Experiment, ExperimentVariant } from '@/types/directus-schema';
interface PageBuilderProps {
	sections: PageBlock[];
}

const PageBuilder = ({ sections }: PageBuilderProps) => {
	const posthog = usePostHog();

	const validBlocks = sections.filter(
		(block): block is PageBlock & { collection: string; item: object } => {
			let shouldAddBlock = true;

			const experiment = block.experiment as Experiment | null | undefined;
			const experimentVariant = block.experiment_variant as ExperimentVariant | null | undefined;

			// Check if the block is an experiment
			if (experiment && experimentVariant) {
				const featureFlag = posthog.getFeatureFlag(experiment.feature_flag_key as string);

				// If the feature flag is not found, add the block if the variant is control
				if (!featureFlag) {
					shouldAddBlock = experimentVariant.key === 'control';
				} else {
					// If the feature flag is found, add the block if the variant matches the feature flag
					shouldAddBlock = featureFlag === experimentVariant.key;
				}
			}

			return shouldAddBlock;
		}
	);

	return (
		<div>
			{validBlocks.map((block) => (
				<div key={block.id} data-background={block.background} className="py-16">
					<Container>
						<BaseBlock block={block} />
					</Container>
				</div>
			))}
		</div>
	);
};
export default PageBuilder;
