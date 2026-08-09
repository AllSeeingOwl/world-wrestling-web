# International Professional Wrestling Heritage Registry (IPWHR) Template

A generic, neutral website template built for the "Crabtree Catalogue" - designed to identify, categorize, and preserve for future generations a definitive collection of professional wrestling's most significant moments.

## 📖 Features

- **Built with Astro & React:** Fast, static-first site generation with interactive React components.
- **Tailwind CSS:** Neutral, generic styling ready to be customized.
- **Content Collections:** Uses Astro Content Collections with a strict Zod schema for easy markdown management.

## 🚀 Setup & Installation

Requires **Node.js v22 or higher** and **pnpm**.

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the development servers:**
   - **Frontend (Astro):**
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
