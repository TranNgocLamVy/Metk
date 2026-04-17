import React, { useEffect, useState } from "react";

import i18n from "@/core/service/i18n";
import { Spinner } from "@/view/components/shadcn/spinner";

export const LanguageLoadingOverlay: React.FC = () => {
	const [isChanging, setIsChanging] = useState(false);

	useEffect(() => {
		const handleStart = () => setIsChanging(true);
		const handleEnd = () => setIsChanging(false);

		i18n.on("languageChanging", handleStart);
		i18n.on("languageChanged", handleEnd);

		return () => {
			i18n.off("languageChanging", handleStart);
			i18n.off("languageChanged", handleEnd);
		};
	}, []);

	if (!isChanging) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface-base backdrop-blur-sm">
			<Spinner />
		</div>
	);
};
