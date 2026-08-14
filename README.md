# World Wrestling Web

A definitive collection of professional wrestling's most significant moments, designed to identify, categorize, and preserve heritage for future generations.

Please refer to the following documents for more details:
- [Wrestling Handbook](wrestling_handbook.md)
- [Platform Architecture](platform_architecture.md)

## 📖 Features

- **Built with Astro & React:** Fast, static-first site generation with interactive React components.
- **Tailwind CSS:** Neutral, generic styling ready to be customized.
- **Content Collections:** Uses Astro Content Collections with a strict Zod schema for easy markdown management.
- **Express Backend:** A dynamic backend server API to manage registry entries.
- **Promotion & Era Filtering:** Features to filter and organize content based on wrestling promotion and era.

## 🚀 Setup & Installation

Requires **Node.js v22 or higher** and **pnpm**.

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the development servers:**
   - **Backend (Express):**
     ```bash
     pnpm run dev:server
     ```
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
