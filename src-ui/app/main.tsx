import "@/assets/style/flexLayout/style.css";
import "@/assets/style/global.css";
import "@/assets/style/shadcn.css";

import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { I18nextProvider } from "react-i18next";
import { Route, HashRouter as Router, Routes } from "react-router-dom";

import i18n from "@/shared/services/i18n";
import DialogRoot from "@/ui/components/dialog/DialogRoot";
import { FallbackRender } from "@/ui/components/layout/FallbackRender";
import { LanguageLoadingOverlay } from "@/ui/components/layout/LanguageLoadingOverlay";
import MainContainer from "@/ui/components/layout/MainContainer";
import MenuBar from "@/ui/components/menuBar/MenuBar";
import { ThemeProvider } from "@/ui/components/providers/ThemeProvider";
import { Toaster } from "@/ui/components/shadcn/sonner";
import HomePage from "./routes/Home";
import WorkspacePage from "./routes/Workspace";

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
							<Route path={"/"} element={<HomePage />} />
							<Route path={"/workspace/:projectId"} element={<WorkspacePage />} />
						</Routes>
					</MainContainer>
				</Router>
			</ThemeProvider>
		</ErrorBoundary>
	</I18nextProvider>,
);