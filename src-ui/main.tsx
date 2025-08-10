import "./global.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

import { DialogContainer } from "./components/custom/DialogContainer/DialogContainer";
import AppcoreWrapper from "./components/layout/AppcoreWrapper/AppcoreWrapper";
import { FallbackRender } from "./components/layout/FallbackRenderer/FallbackRender";
import MainContainer from "./components/layout/MainContainer/MainContainer";
import MenuBar from "./components/layout/MenuBar/MenuBar";
import { ThemeProvider } from "./components/providers/Theme/ThemeProvider";
import { Toaster } from "./components/shadcn/sonner";
import HomePage from "./pages/home";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<MenuBar />
			<MainContainer>
				<Toaster position="top-right" richColors closeButton/>
                <DialogContainer />
				<ErrorBoundary fallbackRender={FallbackRender}>
                    <AppcoreWrapper>
                        <HomePage />
                    </AppcoreWrapper>
				</ErrorBoundary>
			</MainContainer>
		</ThemeProvider>
	</React.StrictMode>
);
