import { IDockviewPanelProps, ISplitviewPanelProps } from "dockview";
import { useEffect } from "react";

export function useResizeNestedDock(api: any, props: IDockviewPanelProps | ISplitviewPanelProps) {
    useEffect(() => {
        if (!api) return;
        const dispose = props.api.onDidDimensionsChange((event) => {
            requestAnimationFrame(() => {
                api.layout(event.width, event.height, true);
            })
        })
        return () => {
            dispose.dispose();
        }
    }, [api])
}