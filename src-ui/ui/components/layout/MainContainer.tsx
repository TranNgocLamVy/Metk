import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useNavigationStore } from "@/ui/stores/navigation.store";

import WorkspaceConsole from "@/ui/workspace/console/Console";
import SecurityShield from "./SecurityShield";

interface MainContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode;
}

export default function MainContainer({ children, ...props }: MainContainerProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const navigate = useNavigate();
	const setNavigate = useNavigationStore((s) => s.setNavigate);

	useLayoutEffect(() => {
		setNavigate(navigate);
	}, [navigate, setNavigate]);

	useLayoutEffect(() => {
		if (containerRef.current) {
			const menuBar = document.getElementById("menu-bar");
			if (menuBar) {
				containerRef.current.style.paddingTop = `${menuBar.clientHeight}px`;
			}
		}
	}, [containerRef.current]);

	return (
		<main id="main-container" {...props} ref={containerRef} className="w-full cursor-default h-dvh bg-surface-base">
			<SecurityShield />
			{children}
            <WorkspaceConsole />
		</main>
	);
}
