import "@/assets/style/flexLayout/style.css";
import "@/assets/style/global.css";

import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter as Router, Route, Routes } from "react-router-dom";

import { FallbackRender } from "@/view/components/layout/fallbackRender";
import MainContainer from "@/view/components/layout/mainContainer";
import MenuBar from "@/view/components/layout/menuBar/menuBar";
import { ThemeProvider } from "@/view/components/providers/themeProvider";
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
				<Toaster position="top-center" richColors closeButton={false} />
				<DialogContainer />
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
