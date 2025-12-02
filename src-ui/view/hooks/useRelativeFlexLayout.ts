import { Layout } from "flexlayout-react";
import { useLayoutEffect } from "react";

export function useRelativeFlexLayout(layoutRef: React.MutableRefObject<Layout | null>) {
    useLayoutEffect(() => {
        const layoutInstance = layoutRef.current;
		if (!layoutInstance || typeof layoutInstance.getRootDiv !== "function") return;
        const rootDiv = layoutInstance.getRootDiv();
        if (!rootDiv) return;
		rootDiv.style.position = "relative";
		rootDiv.style.width = "100%";
		rootDiv.style.height = "100%";
    }, [layoutRef]);
}