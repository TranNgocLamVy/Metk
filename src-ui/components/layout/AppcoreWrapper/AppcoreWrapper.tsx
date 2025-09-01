import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Fragment } from "react/jsx-runtime";

import { Appcore } from "@/appcore/core";
import { useNavigationStore } from "@/stores/ui/NavigationStore";

interface AppcoreWrapperProps {
	children: React.ReactNode;
}

export default function AppcoreWrapper({ children }: AppcoreWrapperProps) {
	const navigate = useNavigate();
	const setNavigate = useNavigationStore((s) => s.setNavigate);

	useEffect(() => {
		setNavigate(navigate);
	}, [navigate, setNavigate]);

	useEffect(() => {
		Appcore.initializeAppcore();
		return () => {
			Appcore.uninitializeAppcore();
		};
	}, []);

	return <Fragment>{children}</Fragment>;
}
