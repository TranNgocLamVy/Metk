# AutoTile Project Guidelines

## Build/Test/Lint Commands
- **Build Frontend**: `npm run build` (TypeScript + Vite build)
- **Build WASM**: `npm run build:wasm` (WASM module compilation)
- **Dev Server**: `npm run dev` (Vite dev server on port 1420)
- **Tauri Commands**: `npm run tauri dev` / `npm run tauri build`
- **Rust Build**: `cd src-tauri && cargo build` / `cargo test`
- **WASM Build**: `cd src-wasm && wasm-pack build --target web --out-dir ../src-ui/wasm --release`
- **No test framework currently configured** - check package.json scripts for updates

## Architecture
- **Tauri App**: Multi-language desktop app (Rust backend + React frontend + WASM modules)
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + Radix UI components
- **Backend**: Tauri (Rust) with fs and opener plugins  
- **WASM Module**: Rust-based WebAssembly for performance-critical operations
- **UI Components**: Shadcn/ui (New York style) + custom components + Lucide icons
- **State**: Zustand for state management, React Error Boundary for error handling

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, paths use `@/` alias for `src-ui/`
- **React**: Function components with hooks, React.StrictMode in production
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Use `@/` alias, group external deps before internal
- **Components**: Use shadcn/ui patterns, Radix primitives, class-variance-authority for styling
- **Error Handling**: Use React Error Boundary, prefer explicit error states
