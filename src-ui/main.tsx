import "@/assets/style/flexLayout/style.css";
import "@/assets/style/global.css";
import "@/assets/style/shadcn.css";

import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { I18nextProvider } from "react-i18next";
import { HashRouter as Router, Route, Routes } from "react-router-dom";

import { FallbackRender } from "@/view/components/layout/FallbackRender";
import MainContainer from "@/view/components/layout/MainContainer";
import MenuBar from "@/view/components/menuBar/MenuBar";
import { ThemeProvider } from "@/view/components/providers/ThemeProvider";
import { Toaster } from "@/view/components/shadcn/sonner";

import i18n from "./core/service/i18n";
import { LanguageLoadingOverlay } from "./view/components/layout/LanguageLoadingOverlay";
import { appRoutes } from "./view/pages";
import DialogRoot from "./view/components/dialog/DialogRoot";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<I18nextProvider i18n={i18n}>
		<ErrorBoundary fallbackRender={FallbackRender}>
			<ThemeProvider>
				<MenuBar />
				<Router>
					<MainContainer>
						<Toaster position="bottom-right" richColors closeButton={false} />
						<DialogRoot />
						<LanguageLoadingOverlay />
						<Routes>
							{appRoutes.map(({ path, element }, index) => (
								<Route key={index} path={path} element={element} />
							))}
						</Routes>
					</MainContainer>
				</Router>
			</ThemeProvider>
		</ErrorBoundary>
	</I18nextProvider>,
);