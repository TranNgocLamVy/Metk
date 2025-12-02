import { useRef } from "react";

import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";

import { TilesetViewContextMenu } from "../contextMenu/tilesetViewContextMenu";
import { HStack, VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function TilesetView() {
    const ref = useRef<HTMLDivElement>(null);

    useHorizontalScroll(ref);

    return (
        <VStack className="tilesetview w-full h-full ">
            <VStack className="w-full h-full bg-secondary-background" justify="center" align="center">
                Tileset view
            </VStack>
            <HStack className="w-full h-fit bg-background" justify="start" align="center">
                <TilesetViewContextMenu />
                <div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar gap-0">
                    <TileSetTab />
                    <TileSetTab />
                    <TileSetTab />
                </div>
            </HStack>
        </VStack>
    );
}

const TileSetTab = () => {
    return <Button size={"sm"} className="rounded-none bg-background text-foreground hover:bg-secondary-background">Test</Button>
}

