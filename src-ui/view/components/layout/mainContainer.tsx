import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useUIHook } from "@/view/hooks/useUIHook";
import { useNavigationStore } from "@/view/stores/menu/navigationStore";

import SecurityShield from "./securityShield";

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

    useUIHook();

	return (
		<main {...props} ref={containerRef} className="w-full cursor-default h-dvh bg-background">
            <SecurityShield />
			{children}
		</main>
	);
}
