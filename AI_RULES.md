# AI Development Rules - São Jorge FC

## Tech Stack
*   **Framework:** React 19 with TypeScript for a robust, type-safe frontend.
*   **Styling:** Tailwind CSS 4 for utility-first styling and modern CSS features.
*   **Routing:** React Router 7 for client-side navigation and layout management.
*   **Animations:** Motion (formerly Framer Motion) for smooth transitions and interactive elements.
*   **Icons:** Lucide React for a consistent and lightweight icon set.
*   **Backend:** Express.js server acting as a proxy for GitHub-based data persistence.
*   **Data Persistence:** JSON-based storage (`data.json`) synced with a GitHub repository.
*   **PDF Generation:** jsPDF and jspdf-autotable for generating financial and match reports.
*   **Date Management:** date-fns for reliable date parsing, formatting, and calculations.

## Library Usage Rules
*   **Icons:** Always use `lucide-react`. Do not install other icon libraries.
*   **Animations:** Use `motion` from the `motion/react` package for all UI animations and transitions.
*   **Styling Utilities:** Use `clsx` and `tailwind-merge` for conditional classes and resolving Tailwind conflicts.
*   **Notifications:** Use `react-hot-toast` for all user feedback (success, error, loading).
*   **Data Fetching:** All communication with the backend must go through the `api` object defined in `src/lib/api.ts`.
*   **Authentication:** Use the `useAuth` hook from `src/context/AuthContext.tsx` to check roles (`Diretoria`, `Membro`, `Jogador`) and permissions.
*   **Date Formatting:** Use `date-fns` for any complex date logic or localized formatting.
*   **Unique IDs:** Use the `uuid` package (v4) for generating unique identifiers for new players or transactions.

## Development Guidelines
*   **Responsive Design:** All components must be mobile-first and fully responsive.
*   **Type Safety:** Maintain strict TypeScript types for all data structures (Players, Stats, Transactions).
*   **Persistence:** Remember that data is saved to `data.json` via the Express API, which then syncs to GitHub. Ensure API calls are handled with proper loading states.
*   **Permissions:** Always check `canAccess(module)` before rendering sensitive UI elements or allowing actions.