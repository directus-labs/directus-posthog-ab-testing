# Directus with PostHog A/B Testing Integration

A production-ready template demonstrating how to integrate PostHog with Directus for implementing A/B testing in Next.js applications. This template provides a complete setup for content management with Directus and feature flagging/A/B testing with PostHog.

## Features

- 🔀 Page-level A/B testing with PostHog feature flags
- 📊 Experiment tracking and analytics
- 🗃️ Headless CMS with Directus for content management
- 🚀 Modern Next.js 15 frontend with App Router
- 🔒 Type-safe development environment
- ⚡ Automated experiment creation via Directus flows

## Getting Started

**Prerequisites**

- Docker and Docker Compose
- Node.js 18+ and pnpm (recommended) or npm
- A PostHog account and project

### 1. Clone the repository

```bash
git clone https://github.com/directus-labs/directus-posthog-ab-testing.git
cd posthog-ab-testing
```

### 2. Set up Directus

Navigate to the Directus directory and set up environment variables:

```bash
cd directus
cp .env.example .env
```

Edit the `.env` file to configure your Directus installation:

Start the Directus instance:

```bash
docker compose up -d
```

Directus will be available at `http://localhost:8055` (or your configured port).

### 3. Apply the Directus template

Apply the template to set up the necessary collections and schema:

```bash
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --directusToken="your-admin-token" --templateLocation="./directus/template" --templateType="local"
```

### 4. Configure PostHog Integration in Directus

After applying the template and logging into Directus:

1. Navigate to Globals
2. Make sure you add the following fields to the global settings
   - **PostHog Project ID**: Your PostHog project ID
   - **PostHog Private API Ke**y: A private API key created in PostHog

These settings enable the built-in Directus flow that automatically creates and manages A/B testing experiments in PostHog when content editors create them in Directus.

### 5. Set up the Next.js frontend

Navigate to the Next.js directory and set up environment variables:

```bash
cd ../nextjs
cp .env.example .env
```

Edit the `.env` file to configure your Next.js application:

```
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_PUBLIC_TOKEN=<your-directus-public-token>
DIRECTUS_FORM_TOKEN=<your-directus-form-token>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DRAFT_MODE_SECRET=<your-draft-mode-secret>
NEXT_PUBLIC_POSTHOG_KEY=<your-posthog-api-key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Install dependencies and run the development server:

```bash
pnpm i
pnpm dev
```

The Next.js application will be available at `http://localhost:3000`.

## PostHog Configuration

### 1. Create a PostHog Account and Project

If you don't already have a PostHog account:

1. Sign up at [PostHog](https://app.posthog.com/signup)
2. Create a new project
3. Copy your API key (Project Settings > Project API Key)
4. Create a personal API key:
   - Go to your user settings by clicking on your profile picture > "Settings"
   - Navigate to "Personal API Keys"
   - Create a new key with appropriate permissions (at minimum: "View and create feature flags")
   - Copy this key for use in Directus global variables

### 2. Set up Feature Flags for A/B Testing

The integration provides two ways to create feature flags:

#### Automated (via Directus)

Content editors can create experiments directly in Directus:

1. Navigate to the "Experiments" collection in Directus
2. Create a new experiment with:
   - Name: The experiment name
   - Feature Flag Key: Unique identifier for the underlying feature flag
   - Variants: Every experiement has to have a control variant, but you can add as many other variants as you like

The Directus flow will automatically create the corresponding feature flag in PostHog with the correct payload structure.

#### Manual (in PostHog)

For manual configuration:

1. In PostHog, navigate to Experiments
2. Create a new experiment
   - Name: `your-experiment-name`
   - Key: `your-experiment-key`
   - Roll out to: Select a percentage of users
   - Configure variants
3. For Page (Redirect) tests, add a payload for the feature flags:
   ```json
   {
     "experiment_type": "page",
     "control_path": "/original-page",
     "path": "/variant-page"
   }
   ```

This will automatically redirect users in the test group from the control path to the variant path.

## Directory Structure

```
├── directus/ # Directus headless CMS
│ ├── template/ # Directus schema template
│ ├── extensions/ # Custom Directus extensions
│ │ └── flows/ # Contains PostHog integration flows
│ ├── docker-compose.yaml # Docker Compose setup
│ └── .env.example # Environment variables template
│
├── nextjs/ # Next.js frontend application
│ ├── src/
│ │ ├── posthog/ # PostHog integration
│ │ ├── app/ # Next.js application routes
│ │ ├── components/ # UI components
│ │ ├── lib/ # Utility functions and API clients
│ │ ├── middleware.ts # Next.js middleware for A/B testing
│ │ └── types/ # TypeScript type definitions
│ └── .env.example # Environment variables template
```

## How A/B Testing Works

The A/B testing implementation uses PostHog feature flags with payloads to handle page redirects:

1. Content editors create experiments in Directus
2. Directus flows automatically create the corresponding feature flags in PostHog
3. Next.js middleware checks if the user is in a test group
4. If the user is visiting a control page and is in the test group, they are redirected to the variant page
5. PostHog tracks events and pageviews for both control and variant pages
6. Results can be analyzed in the PostHog insights dashboard

## Advanced Configuration

### Custom Experiments

You can create different types of experiments by modifying the feature flag payload structure in PostHog. The current template supports page-level A/B testing, but you can extend it to support:

- Block
- Content variation testing
- Behavioral experiments

### Directus Content Management

The Directus template includes a base schema for managing content. You can extend it by adding custom collections and fields through the Directus admin interface.

## Production Deployment

### Directus

1. Update the `.env` file with production values:
   - Set secure passwords
   - Configure CORS settings properly
   - Set cookie security settings

2. Deploy using Docker Compose or a container orchestration platform.

### Next.js

1. Build the Next.js application:
   ```bash
   pnpm run build
   ```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.).

## Key Components

Here's a callout to the specific items to make this integration work.

### Directus Integration
- **Experiment Flow**: [`directus/template/src/flows.json`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/directus/template/src/flows.json) - Automates experiment creation in PostHog
- **Transformation Scripts**: [`scripts/format-ph-experiment-payload.js`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/scripts/format-ph-experiment-payload.js) and [`scripts/format-ph-feature-flag-payload.js`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/scripts/format-ph-feature-flag-payload.js) - Convert Directus data to PostHog format. Used in the Directus Flow.
- **Global Settings**: Configure PostHog project ID and API key in Directus settings

### Next.js Integration
- **Directus Data Fetching**: [`nextjs/src/lib/directus/fetchers.ts`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/nextjs/src/lib/directus/fetchers.ts) - Add the experiment and experiment variants collections when fetching pages
- **Middleware**: [`nextjs/src/middleware.ts`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/nextjs/src/middleware.ts) - Handles redirects based on feature flags
- **PostHog Provider**: [`nextjs/src/posthog/PostHogProvider.tsx`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/nextjs/src/posthog/PostHogProvider.tsx) - Initializes PostHog on the client
- **API Routes**: [`nextjs/src/app/api/flags/route.ts`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/nextjs/src/app/api/flags/route.ts) - Server-side feature flag fetching
- **Redirect Logic**: [`nextjs/src/posthog/redirect.ts`](https://github.com/directus-labs/directus-posthog-ab-testing/blob/main/nextjs/src/posthog/redirect.ts) - Determines when to redirect users

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
