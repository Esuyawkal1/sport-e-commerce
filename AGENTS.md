# Repository Governance Rules

## 1. Tech Stack Boundaries
## 1. Tech Stack Boundaries
- Backend: Node.js (v20+ native ESM), Express, MongoDB (via Mongoose), Standard JavaScript (ES6+), pnpm workspace.
- Frontend: React (Vite JS template), Tailwind CSS, Standard JavaScript (JSX), pnpm workspace.
- Standards: Never add a compile or build step for the backend. Native Node.js ESM execution with `"type": "module"` is mandatory.


## 2. Directory Structure Conventions
- Never mix backend and frontend code.
- Backend must follow Clean Architecture (Controllers, Services, Models, Routes).
- Frontend must follow a Feature-Based Architecture (components, hooks, context, pages).

## 3. Tool Execution Policies
- Only use 'pnpm add' to modify dependencies.
- Never run system-level installers ('brew', 'apt-get').
- Always execute 'pnpm run lint' and 'pnpm test' locally to verify code mutations before confirming a task completion.
