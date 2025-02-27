/**
 * Expected payload from Directus filter.items.create
 * {
  "payload": {
    "name": "About Us Page test",
    "feature_flag_key": "about-us-test",
    "test_type": "page,
    "variants": {
      "create": [
        {
          "key": "control",
          "url": "/control"
        },
        {
          "key": "new-about-page",
          "url": /new-about-page"
        }
      ],
      "update": [],
      "delete": []
    }
  },
  "event": "experiments.items.create",
  "collection": "experiments"
}
 */

function transformDirectusToPosthog(directusPayload) {
    try {
      // Parse the Directus payload if it's a string
      const directusData = typeof directusPayload === 'string' ? JSON.parse(directusPayload) : directusPayload;

      // Validate the structure of the input
      if (!directusData || !directusData.payload) {
        throw new Error('Invalid Directus payload structure');
      }

      const experimentData = directusData.payload;

      // Validate required fields
      if (!experimentData.name || !experimentData.feature_flag_key || !experimentData.variants) {
        throw new Error('Missing required fields in experiment data. Each experiment must have a name, feature_flag_key, and variants.');
      }

      // Validate there's a control variant
      if (!experimentData.variants.create.find(variant => variant.key === 'control')) {
        throw new Error('Missing control variant. Each experiment must have a control variant.');
      }

    // If the test is a page test, validate that we have a url for each variant
    if (experimentData.test_type === 'page') {
      if (!experimentData.variants.create.every(variant => variant.url)) {
        throw new Error('Missing URL for variants. For page (redirect) tests, each variant must have a url.');
      }
    }

      // Create the PostHog payload structure
      const posthogPayload = {
        name: experimentData.name,
        description: experimentData?.description,
        feature_flag_key: experimentData.feature_flag_key,
        parameters: {
          feature_flag_variants: []
        },
      };

      // Validate variants
      if (!Array.isArray(experimentData.variants.create) || experimentData.variants.create.length === 0) {
        throw new Error('No variants provided or invalid variants structure');
      }

      // Calculate the rollout percentage
      const variantCount = experimentData.variants.create.length;
      const rolloutPercentage = Math.floor(100 / variantCount);

      // Add variants to the PostHog payload
      experimentData.variants.create.forEach(variant => {
        if (!variant.key) {
          throw new Error('Invalid variant: missing key');
        }
        posthogPayload.parameters.feature_flag_variants.push({
          key: variant.key,
          description: variant?.description,
          rollout_percentage: rolloutPercentage
        });
      });

      return posthogPayload;
    } catch (error) {
      console.error('Error transforming Directus payload to PostHog format:', error.message);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  module.exports = function(data) {
      try {
          const payload = transformDirectusToPosthog(data.$trigger)
          return payload
      }
      catch(error) {
          throw new Error(error.message)
      }
  }
