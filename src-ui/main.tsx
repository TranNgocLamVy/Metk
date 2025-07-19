import React from "react";
import ReactDOM from "react-dom/client";
import TestPage from "./pages/test";
import "./global.css";
import { ThemeProvider } from "./components/providers/Theme/ThemeProvider";
import MenuBar from "./components/layout/MenuBar/MenuBar";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<main className="w-full h-screen flex flex-col ">
                <MenuBar />
				<TestPage />
			</main>
		</ThemeProvider>
	</React.StrictMode>
);
