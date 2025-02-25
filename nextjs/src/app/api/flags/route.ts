import { NextRequest, NextResponse } from 'next/server';
import PostHogClient from '@/posthog/posthog-server';

// Set cache revalidation time to 60 seconds
export const revalidate = 60;

/**
 * Fetches bootstrap data from PostHog for the specified distinct ID
 * using the PostHog Node client
 */
async function fetchPostHogBootstrapData(distinctId: string) {
  try {
    const posthog = PostHogClient();

    // Use the feature flag endpoint from the PostHog Node client
    const featureFlags = await posthog.getAllFlags(distinctId);

    // Create a bootstrap-like response format
    const bootstrapData = {
      distinctId,
      featureFlags,
      // Add any additional data you need in the bootstrap response
    };

    // Close the PostHog connection to prevent hanging requests
    await posthog.shutdown();

    return bootstrapData;
  } catch (error) {
    console.error('Error fetching PostHog bootstrap data:', error);
    throw error;
  }
}

/**
 * API Route handler for fetching bootstrap data with Next.js cache
 * Will automatically cache the response for 60 seconds based on the revalidate setting
 */
export async function GET(request: NextRequest) {
  // Get distinctId from query params
  const { searchParams } = new URL(request.url);
  const distinctId = searchParams.get('distinctId');

  if (!distinctId) {
    return NextResponse.json({ error: 'distinctId parameter is required' }, { status: 400 });
  }

  try {
    // Next.js will automatically cache this response based on the revalidate setting
    const bootstrapData = await fetchPostHogBootstrapData(distinctId);

    return NextResponse.json(bootstrapData);
  } catch (error) {
    console.error('Error retrieving bootstrap data:', error);

return NextResponse.json({
      error: 'Failed to fetch PostHog bootstrap data',
    }, { status: 500 });
  }
}
