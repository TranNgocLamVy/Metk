import "./global.css";

import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter as Router, Route, Routes } from "react-router-dom";

import AppcoreWrapper from "@/components/layout/appcoreWrapper/appcoreWrapper";
import { FallbackRender } from "@/components/layout/fallbackRenderer/fallbackRender";
import MainContainer from "@/components/layout/mainContainer/mainContainer";
import MenuBar from "@/components/layout/menuBar/menuBar";
import { ThemeProvider } from "@/components/providers/theme/themeProvider";
import { Toaster } from "@/components/shadcn/sonner";

import { DialogContainer } from "./components/custom/dialogContainer/dialogContainer";
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
