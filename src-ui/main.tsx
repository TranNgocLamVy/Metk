import "./global.css";

import { ErrorBoundary } from "react-error-boundary";
import { FallbackRender } from "./components/layout/FallbackRenderer/FallbackRender";
import MainContainer from "./components/layout/MainContainer/MainContainer";
import MenuBar from "./components/layout/MenuBar/MenuBar";
import React from "react";
import ReactDOM from "react-dom/client";
import TestPage from "./pages/test";
import { ThemeProvider } from "./components/providers/Theme/ThemeProvider";
import { Toaster } from "sonner";
import AppcoreWrapper from "./components/layout/AppcoreWrapper/AppcoreWrapper";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<MenuBar />
			<MainContainer>
				<Toaster />
				<ErrorBoundary fallbackRender={FallbackRender}>
                    <AppcoreWrapper>
					    <TestPage />
                    </AppcoreWrapper>
				</ErrorBoundary>
			</MainContainer>
		</ThemeProvider>
	</React.StrictMode>
);
