import { Stamp } from "lucide-react";

import { AppCore } from "@/core/appcore";

import { VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function ToolBar() {

    const onClick = () => {
        const toolManager = AppCore.getIns().toolManager;
        toolManager.startTool("stamp");
        alert("Start Stamp")
    }

    return (
        <VStack className="h-full w-8 bg-background">
            <Button onClick={onClick} size={"icon-sm"} variant={"ghost"} className="hover:bg-black/40"> 
                <Stamp />
            </Button>
        </VStack>
    )
}