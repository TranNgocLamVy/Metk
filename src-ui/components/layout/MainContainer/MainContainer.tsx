import { useLayoutEffect, useRef } from "react";

interface MainContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

export default function MainContainer({ children, ...props }: MainContainerProps) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (ref.current) {
            const menuBar = document.getElementById("menu-bar");
            if (menuBar) {
                ref.current.style.paddingTop = `${menuBar.clientHeight}px`;
            }
        }
    }, [ref.current])

    return (
        <main {...props} ref={ref} className="w-full h-screen flex flex-col overflow-hidden">
            {children}
        </main>
    );
}