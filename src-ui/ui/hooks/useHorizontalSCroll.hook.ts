import { useEffect } from "react";

export function useHorizontalScroll(ref: React.RefObject<HTMLDivElement>) {
    useEffect(() => {
        const el = ref.current;
        if (el) {
            const onWheel = (e: WheelEvent) => {
                if (e.deltaY === 0) return;
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            };
            el.addEventListener("wheel", onWheel, { passive: false });
            return () => {
                el.removeEventListener("wheel", onWheel);
            };
        }
    }, []);
}