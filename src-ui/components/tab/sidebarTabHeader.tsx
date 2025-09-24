import { IDockviewPanelHeaderProps } from "dockview";
import { useEffect, useState } from "react";

export function DefaultSidebarTabHeader(props: IDockviewPanelHeaderProps) {
    const [active, setActive] = useState<boolean>(props.api.isActive);

    useEffect(() => {
        const disposable = props.api.onDidActiveChange((event) => {
            setActive(event.isActive);
        });
        return () => disposable.dispose();
    }, [props.api]);


    return (
        <div
            className={`h-full flex flex-row items-center justify-center gap-2 relative
                ${active ? "after:content-[''] after:absolute after:bottom-[-5px] after:-left-2 after:w-[calc(100%+1rem)] after:h-[4px] after:bg-foreground" : ""}`}
        >
            <span>{props.api.title}</span>
        </div>
    );
}