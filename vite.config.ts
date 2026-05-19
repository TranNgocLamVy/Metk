import path from "path";
import { defineConfig } from "vite";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
	plugins: [react({
		babel: {
			plugins: [
				["@babel/plugin-proposal-decorators", { legacy: true }],
				["@babel/plugin-proposal-class-properties", { loose: true }]
			],
		},
	}), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src-ui"),
		}
	},

	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
				protocol: "ws",
				host,
				port: 1421,
			}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src-test/vitest.setup.ts"],
		css: true,
		include: [
			"src-test/**/*.test.ts",
			"src-test/**/*.test.tsx",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src-ui/**/*.{ts,tsx}"],
			exclude: [
				"src-ui/**/*.d.ts",
				"src-ui/app/main.tsx",
			],
		},
	},
}));
