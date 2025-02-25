'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import PostHogPageView from './PageView';

export function PostHogProvider({ children, bootstrap }: { children: React.ReactNode, bootstrap: any }) {
	useEffect(() => {
		posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
			api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
			ui_host: 'https://us.posthog.com',
			person_profiles: 'always',
			bootstrap: bootstrap,
			capture_pageview: false, // Disable automatic pageview capture, as we capture manually
			capture_pageleave: true,
		});
	}, []);

	return (
		<PHProvider client={posthog}>
			<PostHogPageView />
			{children}
		</PHProvider>
	);
}
