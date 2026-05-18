import { DependencyList, useEffect, useRef } from "react";

type ResizeCallback = (entry: ResizeObserverEntry) => void;

export default function useResizeObserver<T extends HTMLElement>(callback: ResizeCallback, deps: DependencyList, timeout: number = 0) {
    const targetRef = useRef<T>(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const target = targetRef.current;
        if (!target) return;

        let timeoutRef: NodeJS.Timeout | null = null;

        const resizeObserver = new ResizeObserver((entries) => {
            if (timeoutRef) clearTimeout(timeoutRef);
            timeoutRef = setTimeout(() => {
                const entry = entries[0];
                if (entry && callbackRef.current) {
                    callbackRef.current(entry);
                }
            }, timeout);
        });
        resizeObserver.observe(target);
        return () => {
            resizeObserver.disconnect();
        };
    }, [...deps]);
    return targetRef;
};