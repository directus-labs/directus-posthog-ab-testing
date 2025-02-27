/**
 * Takes a PostHog experiment response and formats the feature flag payload
 * with proper variant payloads based on experiment type
 */
function formatFeatureFlagPayload(posthogResponse, directusPayload) {
  try {
    const experimentData = posthogResponse.data;
    const directusData = directusPayload.payload;
    const testType = directusData.test_type;

    // Create a lookup map for variant URLs from the directus payload
    const variantUrlMap = {};
    if (directusData.variants && directusData.variants.create) {
      directusData.variants.create.forEach(variant => {
        if (variant.url) {
          variantUrlMap[variant.key] = variant.url;
        }
      });
    }

    // Find control URL
    const controlVariant = directusData.variants.create.find(v => v.key === 'control');
    const controlPath = controlVariant && controlVariant.url ? controlVariant.url : '/';

    // Format variants for the multivariate section
    const variants = experimentData.parameters.feature_flag_variants.map(variant => ({
      key: variant.key,
      description: variant.description,
      rollout_percentage: variant.rollout_percentage,
      name: variant.key === 'control' ?
        `control is good one` :
        variant.description || `variant ${variant.key}`
    }));

    // Create payloads object based on experiment type
    const payloads = {};
    experimentData.parameters.feature_flag_variants.forEach(variant => {
      if (testType === 'page') {
        // For page experiments, include path information using URLs from directus payload
        if (variant.key === 'control') {
          // For control variant, include both control_path and path (its own path)
          payloads[variant.key] = JSON.stringify({
            experiment_type: 'page',
            control_path: controlPath,
            path: variantUrlMap[variant.key] || '/'
          });
        } else {
          // For non-control variants
          payloads[variant.key] = JSON.stringify({
            experiment_type: 'page',
            control_path: controlPath,
            path: variantUrlMap[variant.key] || '/'
          });
        }
      } else {
        // For block experiments, use empty JSON
        payloads[variant.key] = "{}";
      }
    });

    // Create the formatted PostHog payload structure
    return {
      name: experimentData.feature_flag.name,
      key: experimentData.feature_flag_key,
      filters: {
        groups: [
          {
            properties: [],
            rollout_percentage: 100
          }
        ],
        multivariate: {
          variants: variants
        },
        holdout_groups: null,
        aggregation_group_type_index: null,
        payloads: payloads
      }
    };
  } catch (error) {
    console.error('Error formatting feature flag payload:', error.message);
    throw error;
  }
}

module.exports = function(data) {
  try {
    const posthogResponse = data.create_experiment;
    const directusPayload = data.$trigger;
    const featureFlagPayload = formatFeatureFlagPayload(posthogResponse, directusPayload);
    return {
      id: posthogResponse.data.feature_flag.id,
      payload: featureFlagPayload
    };
  }
  catch(error) {
    throw new Error(error.message);
  }
}
