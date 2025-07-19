import { useEffect, RefObject } from "react";

export function  useClickOutside(ref: RefObject<HTMLElement> | RefObject<HTMLElement>[], onClickOutside: () => void) {
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (Array.isArray(ref)) {
				const isOutsideAll = ref.every((r) => r.current && !r.current.contains(event.target as Node));
				if (isOutsideAll) onClickOutside();
			} else {
				if (ref.current && !ref.current.contains(event.target as Node)) {
					onClickOutside();
				}
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClickOutside, ...(Array.isArray(ref) ? ref.map((r) => r.current) : [ref.current])]);
}
