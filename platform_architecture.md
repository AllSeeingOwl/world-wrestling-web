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
- **`src/schema/archive.ts`**: The Zod schema every entry must satisfy, shared by the site build, the Contribute form and the CSV sync.
- **`scripts/`**: Maintenance scripts, such as `sync-csv.ts`, which regenerates `data/registry-entries.csv`.

## 2. Data Flow

### Loading Markdown Files

Entries in the wrestling registry are stored as flat markdown files in `src/content/archive/`. Astro uses its **Content Collections** API to load, parse, and validate these files against a Zod schema defined in `src/schema/archive.ts` and registered in `src/content.config.ts`. The same schema is used by the Contribute form and the CSV sync script.

### Index Page Query

The homepage (`src/pages/index.astro`) uses the `getCollection('archive')` function to query all valid markdown entries. The data is then mapped to UI components (like a grid or list) to display a summary of each registry entry.

### Dynamic Routing

Individual entry pages are generated using dynamic routing (`src/pages/[slug].astro`). Astro's `getStaticPaths()` queries the collection and generates a static HTML page for each markdown file based on its slug.

### Contributions

The site is fully static; there is no backend server. Contributors use the Contribute page (`/contribute`), which builds the Markdown file in the browser and submits it as a GitHub pull request; editing or removing an entry is likewise a pull request that changes or deletes its file. Every change is reviewed before it reaches the site.

### Deployment Flow

The repository is configured for a dual deployment strategy. It can be deployed to **GitHub Pages** (with the base path `/world-wrestling-web`) or to **Vercel** for automatic continuous deployment upon push. GitHub Actions are typically used to build and deploy the static site to GitHub Pages.

## 3. Technology Stack

- **Astro**: Core framework for static site generation (SSG). Provides fast load times by shipping zero JavaScript by default.
- **React**: Used within Astro for interactive UI components where client-side state is necessary.
- **Tailwind CSS**: Utility-first CSS framework for rapid and neutral styling.
- **TypeScript**: Provides static typing across the site and scripts to catch errors early.

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

2. **Start the Development Server**:

   ```bash
   npx astro dev
   ```

   Starts the Astro dev server for frontend development.

3. **Production Build**:
   ```bash
   pnpm run build:astro
   ```
   Generates the static site output in the `dist/` directory.

---

_Note: This architecture is designed to be a generic, neutral template for preserving professional wrestling's most significant moments._
