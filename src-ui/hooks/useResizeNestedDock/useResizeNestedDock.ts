import { IDockviewPanelProps } from "dockview";
import { useEffect } from "react";

export function useResizeNestedDock(api: any, props: IDockviewPanelProps) {
    useEffect(() => {
        if (!api) return;
        const disposeResize = props.api.onDidDimensionsChange((event) => {
            requestAnimationFrame(() => {
                api.layout(event.width, event.height, true);
            })
        })
        return () => {
            disposeResize.dispose();
        }
    }, [api])
}