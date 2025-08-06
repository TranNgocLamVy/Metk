import { useLayoutEffect, useRef } from "react";


interface MainContainerProps {
    children?: React.ReactNode;
}

export default function MainContainer({ children }: MainContainerProps) {
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
        <main ref={ref} className="w-full h-screen flex flex-col">
            {children}
        </main>
    );
}