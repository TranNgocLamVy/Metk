import { Eraser, Stamp } from "lucide-react";

import { AppCore } from "@/core/appcore";

import { VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function ToolBar() {

    const changeTool = (toolId: string) => {
        const toolManager = AppCore.getIns().toolManager;
        toolManager.startTool(toolId);
        alert(toolId);
    }

    return (
        <VStack className="h-full w-8 bg-background">
            <Button onClick={() => changeTool("stamp")} size={"icon-sm"} variant={"ghost"} className="hover:bg-black/40"> 
                <Stamp />
            </Button>
            <Button onClick={() => changeTool("erase")} size={"icon-sm"} variant={"ghost"} className="hover:bg-black/40"> 
                <Eraser />
            </Button>
        </VStack>
    )
}