# Platform Architecture

This document outlines the technical structure of the `world-wrestling-web` repository, adapted from the Fictional History Archive's platform architecture. It details the directory structure, data flow, technology stack, key design decisions, and development workflow.

## 1. Directory Structure (Astro setup)

The project follows a standard Astro directory structure:

- **`.github/workflows/`**: Contains CI/CD pipelines (e.g., GitHub Actions) for automated testing, linting, and deployment.
- **`src/components/`**: Reusable UI components (primarily React) used across different pages.
- **`src/layouts/`**: Base HTML templates (Astro components) that provide the common structure (header, footer, meta tags) for pages.
- **`src/pages/`**: Routing directory for Astro.
  - `index.astro` is the homepage.
  - `[slug].astro` handles dynamic routing for individual archive entries.
- **`src/content/archive/`**: The markdown database. Contains `.md` files representing the wrestling registry entries.
- **`public/`**: Static assets like images, icons, and client-side scripts that are served as-is at the root path.
- **`src/server.ts`**: The entry point for the Express backend, providing an API to manage the static markdown files dynamically.

## 2. Data Flow

### Loading Markdown Files

Entries in the wrestling registry are stored as flat markdown files in `src/content/archive/`. Astro uses its **Content Collections** API to load, parse, and validate these files against a defined Zod schema (configured in `src/content.config.ts`).

### Index Page Query

The homepage (`src/pages/index.astro`) uses the `getCollection('archive')` function to query all valid markdown entries. The data is then mapped to UI components (like a grid or list) to display a summary of each registry entry.

### Dynamic Routing

Individual entry pages are generated using dynamic routing (`src/pages/[slug].astro`). Astro's `getStaticPaths()` queries the collection and generates a static HTML page for each markdown file based on its slug.

### Backend API

The Express backend (`src/server.ts`) functions as an API layer that can dynamically add, update, or remove the static markdown files located in `src/content/archive/`. It utilizes `@upstash/redis` for data and session management.

### Deployment Flow

The repository is configured for a dual deployment strategy. It can be deployed to **GitHub Pages** (with the base path `/world-wrestling-web`) or to **Vercel** for automatic continuous deployment upon push. GitHub Actions are typically used to build and deploy the static site to GitHub Pages.

## 3. Technology Stack

- **Astro**: Core framework for static site generation (SSG). Provides fast load times by shipping zero JavaScript by default.
- **React**: Used within Astro for interactive UI components where client-side state is necessary.
- **Tailwind CSS**: Utility-first CSS framework for rapid and neutral styling.
- **TypeScript**: Provides static typing across the entire codebase (frontend and backend) to catch errors early.
- **Express Backend**: A Node.js backend (using `tsx` for execution) providing an API for managing markdown files dynamically.

## 4. Key Design Decisions

- **Flat-file Markdown (Astro Content Collections)**: Using markdown files as the database allows for easy version control of content, simple authoring without a complex CMS, and seamless integration with Astro's static generation.
- **Zod Schema Validation**: Ensures all markdown frontmatter adheres to a strict schema (`schema.md`), preventing build errors and maintaining data consistency across the registry.
- **GitHub Pages + Vercel Dual Deployment**: Offers flexibility. GitHub Pages provides a free, standard hosting environment tied closely to the repository, while Vercel offers seamless PR previews and serverless function support if needed in the future.

## 5. Development Workflow

The project uses `pnpm` for dependency management.

1. **Install Dependencies**:

   ```bash
   pnpm install
   ```

2. **Start Backend Server**:

   ```bash
   pnpm run dev:server
   ```

   Runs the Express API using `nodemon` and `tsx`.

3. **Start Frontend Development Server**:

   ```bash
   npx astro dev
   ```

   Starts the Astro dev server for frontend development.

4. **Production Build**:
   ```bash
   pnpm run build:astro
   ```
   Generates the static site output in the `dist/` directory.

---

_Note: This architecture is designed to be a generic, neutral template for preserving professional wrestling's most significant moments._
