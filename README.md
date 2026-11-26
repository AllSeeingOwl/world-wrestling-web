# Wrestling Heritage Registry

The website of the International Professional Wrestling Heritage Registry (IPWHR), also known as "The Crabtree Catalogue". A definitive collection of professional wrestling's most significant moments, designed to identify, categorize, and preserve heritage for future generations.

Please refer to the following documents for more details:

- [Registry Charter](charter.md)
- [Editorial Handbook](wrestling_handbook.md)
- [Platform Architecture](platform_architecture.md)

## 📖 Features

- **Built with Astro & React:** Fast, static-first site generation with interactive React components.
- **Tailwind CSS:** Neutral, generic styling ready to be customized.
- **Content Collections:** Uses Astro Content Collections with a strict Zod schema for easy markdown management.
- **Contribute Form:** Contributors propose entries from the site; each one arrives as a GitHub pull request for review.
- **Promotion & Era Filtering:** Features to filter and organize content based on wrestling promotion and era.

## 🚀 Setup & Installation

Requires **Node.js v22 or higher** and **pnpm**.

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the development server:**

   ```bash
   npx astro dev
   ```

3. **Testing & Verification:**

   ```bash
   pnpm run typecheck          # TypeScript validation
   pnpm run lint               # Run ESLint
   pnpm run format             # Run Prettier
   ```

4. **Build for Production:**
   ```bash
   pnpm run build:astro
   ```

## 📊 Data Export

[`data/registry-entries.csv`](data/registry-entries.csv) lists every registry entry, one row per entry, for spreadsheets, backups and analysis. It is generated from the Markdown files in `src/content/archive/`, which remain the source of truth, so don't edit the CSV by hand.

The **Sync Registry CSV** workflow regenerates it automatically whenever entry changes reach `main`. To regenerate it locally:

```bash
pnpm run sync:csv           # update the CSV
pnpm run sync:csv --check   # only report whether it is out of date
```

The script validates every entry against the site's schema and stops with a list of problems if any entry is invalid.
