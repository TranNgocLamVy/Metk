import { useRef } from "react";

import { useLogStore } from "@/view/stores/debug/logStore";

import { VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";
import { ScrollArea } from "../shadcn/scroll-area";

export default function Log() {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

	const { logs, clearLogs } = useLogStore();

	return (
		<VStack className="w-full h-full">
			<ScrollArea ref={scrollAreaRef} className="h-full w-full">
				{logs.map((log, index) => (
					<div key={index} className="p-2 border-b border-border text-xs font-mono">
						{log}
					</div>
				))}
                <Button variant="destructive" onClick={clearLogs} className="w-full">
                    Clear Logs
                </Button>
			</ScrollArea>
		</VStack>
	);
}
