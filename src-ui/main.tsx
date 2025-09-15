import "./global.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter as Router, Route, Routes } from "react-router-dom";

import { DialogContainer } from "@/components/custom/DialogContainer/DialogContainer";
import AppcoreWrapper from "@/components/layout/AppcoreWrapper/AppcoreWrapper";
import { FallbackRender } from "@/components/layout/FallbackRenderer/FallbackRender";
import MainContainer from "@/components/layout/MainContainer/MainContainer";
import MenuBar from "@/components/layout/MenuBar/MenuBar";
import { ThemeProvider } from "@/components/providers/Theme/ThemeProvider";
import { Toaster } from "@/components/shadcn/sonner";

import { appRoutes } from "./pages";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	// <React.StrictMode>
	// </React.StrictMode>
	<ThemeProvider>
		<MenuBar />
		<Router>
			<MainContainer>
				<Toaster position="top-right" richColors closeButton />
				<DialogContainer />
				<AppcoreWrapper />
				<ErrorBoundary fallbackRender={FallbackRender}>
					<Routes>
						{appRoutes.map(({ path, element }, index) => (
							<Route key={index} path={path} element={element} />
						))}
					</Routes>
				</ErrorBoundary>
			</MainContainer>
		</Router>
	</ThemeProvider>
);
