import "@/assets/style/flexLayout/style.css";
import "@/assets/style/global.css";
import "@/assets/style/shadcn.css";

import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter as Router } from "react-router-dom";

import ThemeProvider from "@/app/providers/theme.provider";
import DialogRoot from "@/ui/components/dialog/DialogRoot";
import { FallbackRender } from "@/ui/components/layout/FallbackRender";
import { LanguageLoadingOverlay } from "@/ui/components/layout/LanguageLoadingOverlay";
import MainContainer from "@/ui/components/layout/MainContainer";
import MenuBar from "@/ui/components/menu-bar/MenuBar";
import { Toaster } from "@/ui/components/shadcn/sonner";
import ContextBar from "@/ui/workspace/ContextBar";
import I18nProvider from "./providers/i18n.provider";
import AppRoutes from "./routes";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<I18nProvider>
		<ErrorBoundary fallbackRender={FallbackRender}>
			<ThemeProvider>
				<MenuBar />
				<Router>
					<MainContainer>
						<Toaster position="bottom-right" richColors closeButton={false} />
						<DialogRoot />
						<LanguageLoadingOverlay />
						<AppRoutes />
					</MainContainer>
				</Router>
				<ContextBar />
			</ThemeProvider>
		</ErrorBoundary>
	</I18nProvider>,
);