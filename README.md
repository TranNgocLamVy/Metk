# MEtk (Modern Editor Toolkit)

MEtk is a specialized tilemap editor designed for high-performance level design workflows. Built on the Tauri framework, it implements a decoupled architecture that separates native host operations from application logic and user interface concerns.

## Technical Architecture

The project follows a layered architectural pattern to ensure scalability and maintainability:

1. **Host Layer (Rust/Tauri):**
   - Manages native OS windowing and lifecycle.
   - Provides secure, typed IPC (Inter-Process Communication) for filesystem access and system-level configurations.

2. **Core Layer (TypeScript):**
   - **AppCore & Managers:** Orchestrates the lifecycle of Projects, Tilemaps, Tilesets, and Tools.
   - **Command System:** Implements a robust undo/redo architecture where editor actions are encapsulated as discrete Command objects.
   - **Session Management:** Handles active editing contexts for both tilemaps and tilesets independently.
   - **Auto-Tiling:** Includes a dedicated "AtRule" system for constraint-based tile placement logic.

3. **Infrastructure Layer:**
   - **Data Integrity:** Utilizes ArkType for runtime schema validation and safe JSON serialization.
   - **Storage Providers:** Abstraction layer for filesystem operations, currently optimized for Tauri's native API.

4. **View & Rendering Layer (React):**
   - **Workspace:** Powered by FlexLayout, offering a professional, dockable IDE-style interface.
   - **Rendering:** High-performance HTML5 Canvas engine tailored for grid-based manipulation.
   - **State:** Synchronized via specialized stores (Zustand/Custom) that bridge UI components with the Core logic.

## Project Structure

- `src-tauri/`: Native Rust environment and desktop integration.
- `src-ui/`: Main frontend codebase.
  - `core/`: Pure business logic, command implementations, and manager systems.
  - `infrastructure/`: Serializers and external service providers.
  - `shared/`: Centralized ArkType schemas and TypeScript definitions.
  - `view/`: React components, workspace layouts, and UI state stores.

## Development

### Requirements
- Node.js (LTS)
- Rust Toolchain (cargo, rustc)

### Build Process
1. Clone the repository.
2. Initialize dependencies:
```bash
   npm install
```

Execute the application in development mode with hot-reloading:
```bash
npm run tauri dev
```

Compile a production-ready binary:
```bash
npm run tauri build
```

### License
MEtk is released under the GNU General Public License v2.0 (GPL-2.0). See the LICENSE file for the full license text.