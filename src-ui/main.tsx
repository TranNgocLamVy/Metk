import "./global.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

import AppcoreWrapper from "./components/layout/AppcoreWrapper/AppcoreWrapper";
import { FallbackRender } from "./components/layout/FallbackRenderer/FallbackRender";
import MainContainer from "./components/layout/MainContainer/MainContainer";
import MenuBar from "./components/layout/MenuBar/MenuBar";
import { ThemeProvider } from "./components/providers/Theme/ThemeProvider";
import { Toaster } from "./components/shadcn/sonner";
import Test from "./pages/test/test";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<MenuBar />
			<MainContainer>
				<Toaster />
				<ErrorBoundary fallbackRender={FallbackRender}>
                    <AppcoreWrapper>
                        <Test />
                    </AppcoreWrapper>
				</ErrorBoundary>
			</MainContainer>
		</ThemeProvider>
	</React.StrictMode>
);
