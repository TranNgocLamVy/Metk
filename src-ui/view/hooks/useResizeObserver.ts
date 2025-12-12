import { DependencyList, useEffect, useRef } from "react";

type ResizeCallback = (entry: ResizeObserverEntry) => void;

export default function useResizeObserver<T extends HTMLElement>( callback: ResizeCallback, deps: DependencyList = []) {
    const targetRef = useRef<T>(null);
    const callbackRef = useRef(callback);
    
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const target = targetRef.current;
        if (!target) return;
        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry && callbackRef.current) {
                callbackRef.current(entry);
            }
        });
        resizeObserver.observe(target);
        return () => {
            resizeObserver.disconnect();
        };
    }, [...deps]);
    return targetRef;
};