import { useEffect, useState } from "react";
import { invoke } from '@tauri-apps/api/core';
import initWasm, { Point } from "./wasm/wasm_module";

let wasm: any;

export default function App() {
	const [imgUrl, setImgUrl] = useState<string | null>(null);

	const loadImage = async () => {
		try {
			// Adjust the path to an actual PNG file on disk
			const path = "C:\\Users\\Tran Ngoc Lam Vy\\Pictures\\Screenshots\\Screenshot 2025-07-02 232503.png"; // For Windows
			// const path = "/Users/you/image.png"; // For macOS/Linux

			const buffer = await invoke<Uint8Array>("read_png_file", { path });

			// Convert Uint8Array to Blob
			const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });

			// Create Object URL
			const url = URL.createObjectURL(blob);

			setImgUrl(url);
		} catch (err) {
			console.error("Failed to load image:", err);
		}
	};

	useEffect(() => {
		async function loadWasm() {
			wasm = await initWasm();
		}
		loadWasm();
	}, []);

	const onClick = () => {
		const point = new Point(4, 5);
		const result = point.sum();
		console.log(`Sum of point coordinates: ${result}`);
	};

	return (
		<main className="container">
			<button onClick={onClick}>Add</button>
			<div>
				<button onClick={loadImage}>Load PNG</button>
				{imgUrl && <img src={imgUrl} alt="Loaded PNG" />}
			</div>
		</main>
	);
}
