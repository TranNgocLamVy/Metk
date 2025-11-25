import "./global.css";

import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter as Router, Route, Routes } from "react-router-dom";

import AppcoreWrapper from "@/view/components/layout/appcoreWrapper/appcoreWrapper";
import { FallbackRender } from "@/view/components/layout/fallbackRenderer/fallbackRender";
import MainContainer from "@/view/components/layout/mainContainer/mainContainer";
import MenuBar from "@/view/components/layout/menuBar/menuBar";
import { ThemeProvider } from "@/view/components/providers/theme/themeProvider";
import { Toaster } from "@/view/components/shadcn/sonner";

import { DialogContainer } from "./view/components/custom/dialogContainer/dialogContainer";
import { appRoutes } from "./view/pages";

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
