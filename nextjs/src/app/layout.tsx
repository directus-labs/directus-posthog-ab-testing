import '@/styles/globals.css';
import '@/styles/fonts.css';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';

import NavigationBar from '@/components/layout/NavigationBar';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { fetchSiteData } from '@/lib/directus/fetchers';
import { getDirectusAssetURL } from '@/lib/directus/directus-utils';
import { PostHogProvider } from '@/posthog/PostHogProvider';

export async function generateMetadata(): Promise<Metadata> {
	const { globals } = await fetchSiteData();

	const siteTitle = globals?.title || 'Simple CMS';
	const siteDescription = globals?.description || 'A starter CMS template powered by Next.js and Directus.';
	const faviconURL = globals?.favicon ? getDirectusAssetURL(globals.favicon) : '/favicon.ico';

	return {
		title: {
			default: siteTitle,
			template: `%s | ${siteTitle}`,
		},
		description: siteDescription,
		icons: {
			icon: faviconURL,
		},
	};
}

export default async function RootLayout({ children }: { children: ReactNode }) {
	const { globals, headerNavigation, footerNavigation } = await fetchSiteData();

	// Get PostHog bootstrap data from headers set in middleware
	const headersList = await headers();
	const bootstrap = headersList.get('x-posthog-bootstrap');

	const accentColor = globals?.accent_color || '#6644ff';

	return (
		<html lang="en" style={{ '--accent-color': accentColor } as React.CSSProperties} suppressHydrationWarning>
			<PostHogProvider bootstrap={bootstrap}>
				<body className="antialiased font-sans flex flex-col min-h-screen">
					<ThemeProvider>
						<NavigationBar navigation={headerNavigation} globals={globals} />
						<main className="flex-grow">{children}</main>
						<Footer navigation={footerNavigation} globals={globals} />
					</ThemeProvider>
				</body>
			</PostHogProvider>
		</html>
	);
}
