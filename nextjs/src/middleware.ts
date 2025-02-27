import { NextResponse, NextRequest } from 'next/server';
import { checkForRedirect } from '@/posthog/redirect';
import type { PostHogFlags } from '@/posthog/types';
// Cookie name for our bootstrap data cache
const BOOTSTRAP_CACHE_COOKIE = 'ph_bootstrap_cache';
// Cookie TTL in seconds (60 seconds)
const CACHE_TTL = 60;

export function getPostHogCookieName(): string {
	const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;

	return `ph_${phKey}_posthog`;
}

/**
 * Get a unique identifier for the user from existing PostHog cookie
 */
function getDistinctId(request: NextRequest): string {
	// Get the PostHog cookie name based on the API key
	const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;

	// Get the PostHog cookie
	const phCookie = request.cookies.get(`ph_${phKey}_posthog`);

	// If the cookie exists, parse it and get the distinct_id
	if (phCookie?.value) {
		try {
			const phCookieParsed = JSON.parse(phCookie.value);
			if (phCookieParsed.distinct_id) {
				return phCookieParsed.distinct_id;
			}
		} catch (e) {
			console.error('Failed to parse PostHog cookie:', e);
		}
	}

	// If no distinct ID found, use the request ID as fallback
	// We'll let PostHog assign a proper ID when the client initializes
	const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

	return `middleware_${requestId}`;
}

/**
 * Fetch PostHog bootstrap data from our API
 */
async function fetchPostHogBootstrap(distinctId: string, baseUrl: string): Promise<PostHogFlags> {
	try {
		const response = await fetch(`${baseUrl}/api/flags?distinctId=${distinctId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Error fetching PostHog data: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching PostHog bootstrap data:', error);
		// Return empty flags as fallback

		return {
			featureFlags: {},
			featureFlagPayloads: {},
		};
	}
}

export async function middleware(request: NextRequest) {
	// Request pathname and base URL
	const requestPathname = request.nextUrl.pathname;
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

	// Get the user's distinct ID
	const distinctId = getDistinctId(request);

	// Try to get cached bootstrap data from our cookie
	const bootstrapCacheCookie = request.cookies.get(BOOTSTRAP_CACHE_COOKIE);
	let bootstrapData: PostHogFlags | null = null;
	let shouldFetchFresh = false;

	// Parse cached data if available
	if (bootstrapCacheCookie?.value) {
		try {
			const cachedData = JSON.parse(bootstrapCacheCookie.value);

			// Check if the cache has expired
			const now = Date.now();
			if (cachedData.timestamp && now - cachedData.timestamp < CACHE_TTL * 1000) {
				// Cache is still valid
				bootstrapData = cachedData.data;
				console.log('Using cached bootstrap data from cookie');
			} else {
				// Cache has expired
				shouldFetchFresh = true;
			}
		} catch (e) {
			console.error('Failed to parse bootstrap cache cookie:', e);
			shouldFetchFresh = true;
		}
	} else {
		shouldFetchFresh = true;
	}

	// Fetch fresh data if needed
	if (shouldFetchFresh || !bootstrapData) {
		console.log('Fetching fresh bootstrap data');
		bootstrapData = await fetchPostHogBootstrap(distinctId, baseUrl);
	}

	// Check if we need to redirect based on feature flags
	const redirectPath = checkForRedirect(requestPathname, bootstrapData);

	// If a redirect is needed, perform it
	if (redirectPath) {
		const redirectUrl = new URL(redirectPath, baseUrl);
		const response = NextResponse.redirect(redirectUrl);

		// Also save the bootstrap data in the redirect response
		const cacheValue = JSON.stringify({
			timestamp: Date.now(),
			data: bootstrapData,
		});

		response.cookies.set({
			name: BOOTSTRAP_CACHE_COOKIE,
			value: cacheValue,
			path: '/',
			maxAge: CACHE_TTL,
			sameSite: 'lax',
		});

		return response;
	}

	// No redirect needed, continue with the request
	// Set a header with path so we can get that info in our server components
	const requestHeaders = new Headers(request.headers);
	requestHeaders.set('x-pathname', requestPathname);

	// Store bootstrap data in header for client-side use
	requestHeaders.set('x-posthog-bootstrap', JSON.stringify(bootstrapData));

	// Create response with updated headers
	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});

	// Save the bootstrap data in a cookie for subsequent requests
	const cacheValue = JSON.stringify({
		timestamp: Date.now(),
		data: bootstrapData,
	});

	response.cookies.set({
		name: BOOTSTRAP_CACHE_COOKIE,
		value: cacheValue,
		path: '/',
		maxAge: CACHE_TTL,
		sameSite: 'lax',
	});

	return response;
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons|fonts).*)'],
};
