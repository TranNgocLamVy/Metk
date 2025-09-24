import { IDockviewPanelHeaderProps } from "dockview";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { useTilemapDockStore } from "@/stores/dock/tilemapDockStore";

export function DefaultTilemapTabHeader(props: IDockviewPanelHeaderProps) {
    const [active, setActive] = useState<boolean>(props.api.isActive);

    useEffect(() => {
        const disposable = props.api.onDidActiveChange((event) => {
            setActive(event.isActive);
        });
        return () => disposable.dispose();
    }, [props.api]);

    const onClose = () => {
        useTilemapDockStore.getState().closePanel(props.api.id);
    };

    return (
        <div
            className={`h-full flex flex-row items-center justify-center gap-2 relative
                ${active ? "after:content-[''] after:absolute after:bottom-[-5px] after:-left-2 after:w-[calc(100%+1rem)] after:h-[4px] after:bg-foreground" : ""}`}
        >
            <span>{props.api.title}</span>
            <X
                size={20}
                className="p-0.5 rounded-lg hover:bg-foreground/10"
                onClick={onClose}
            />
        </div>
    );
}