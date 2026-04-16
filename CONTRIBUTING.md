# Contributing to Metk

We appreciate interest in contributing to the Metk project. To maintain code quality and architectural integrity, please adhere to the following guidelines.

## Bug Reports

Before submitting a bug report, ensure you are running the latest version of the main branch. Use the GitHub Issue Tracker to file reports with the following technical details:
- Host Operating System and version.
- Detailed reproduction steps.
- Relevant log output from the Tauri terminal or Browser console.
- Expected vs. actual behavior.

## Standards & Practices

- **Type Safety:** All new logic must be strictly typed. Use the schemas defined in `src-ui/shared/schema` for any data structures that require serialization.
- **Architecture Adherence:** Ensure a strict separation between the `core` logic and `view` components. Business logic should reside in managers or commands, not within React hooks or components.
  - TypeScript: Adhere to the project's ESLint and Prettier configurations.
- **Validation:** Use ArkType for any new data models to ensure runtime integrity.

## Development Workflow

1. Fork the repository and create a feature branch from `develop`.
2. Implement changes following the Command pattern for any user-facing actions.
3. Verify that changes do not break the FlexLayout workspace integrity.
4. Submit a Pull Request to the `develop` branch with a technical summary of your changes.

## Architectural Constraints

- Avoid direct heavy computations in the UI thread; utilize the WASM layer for map-wide operations.
- Ensure all IPC commands are properly handled and errors are propagated back to the UI layer gracefully.
- Maintain strict typing for all new interfaces in the `plugin-api`.

## License

By contributing to Metk, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0. See the [LICENSE.md](LICENSE.md) file for the full, official legal text.