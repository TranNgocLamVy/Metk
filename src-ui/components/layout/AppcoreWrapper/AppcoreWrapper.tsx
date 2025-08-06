import { AppCore } from "@/appcore/AppCore";
import { useEffect } from "react";
import { Fragment } from "react/jsx-runtime";

interface AppcoreWrapperProps {
	children: React.ReactNode;
}

export default function AppcoreWrapper({ children }: AppcoreWrapperProps) {
    useEffect(() => {
        AppCore.initializeAppCore();
        return () => {
            AppCore.uninitializeAppCore();
        }
    }, [])
    
	return <Fragment>{children}</Fragment>;
}
