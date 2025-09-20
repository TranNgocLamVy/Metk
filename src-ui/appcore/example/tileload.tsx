import { Viewport } from "pixi-viewport";
import { Application, Container, Point, Sprite, Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";

import { DefaultTilemapRenderer } from "@/appcore/default/renderer/defaultTilemapRenderer";
import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";
import { DefaultTileset } from "@/appcore/default/tile/defaultTileset";
import { TilesetManager } from "@/appcore/models/manager/tilesetManager";
import { HStack, VStack } from "@/components/custom/stack/stack";
import { Button } from "@/components/shadcn/button";
import { useExtend } from "@pixi/react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

export default function TestPage() {
    useExtend({ Sprite });

    const [app, setApp] = useState<Application | null>(null);
    const [viewport, setViewport] = useState<Viewport | null>(null);
    const [tilesetManager, setTilesetManager] = useState<TilesetManager>(new TilesetManager());
    const [tilemap, setTilemap] = useState<DefaultTilemap | null>(null);
    const [tilemapRenderer, setTilemapRenderer] = useState<DefaultTilemapRenderer | null>(null);

    useEffect(() => {

    }, [])

    const loadTilemap = async () => {
        const filePath = await openDialog();
        if (!filePath || !viewport) return;

        const tilemap = await DefaultTilemap.loadTilemap(filePath, {
            tilesetManager: tilesetManager,
        });

        if (!tilemap) return;
        setTilemap(tilemap);
        const tileRenderer = new DefaultTilemapRenderer({tilemap})
        setTilemapRenderer(tileRenderer);
        tileRenderer.initRenderer(viewport);
        console.log(tilemap);
    };

    const loadTileset = async () => {
        const filePath = await openDialog();
        if (!filePath || !tilesetManager) return;

        const tileset = await DefaultTileset.loadTileset(filePath);
        if (!tileset) return;
        tilesetManager.loadTileset(filePath, tileset);
    }


    const initApp = (app: Application) => {
        setApp(app);
        const viewport = new Viewport({
            screenWidth: app.screen.width,
            screenHeight: app.screen.height,
            worldWidth: app.screen.width,
            worldHeight: app.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: app.renderer.events,
        });

        viewport.drag({ mouseButtons: "middle" }).wheel().decelerate({ friction: 0 });

        viewport.eventMode = "static";
        viewport.hitArea = app.screen;

        app.stage.addChild(viewport);
        setViewport(viewport);
    };

    return (
        <VStack className="h-full">
            <HStack>
                <Button onClick={loadTilemap}>Load Tilemap</Button>
                <Button onClick={loadTileset}>Load Tileset</Button>
            </HStack>
            {/* <Canvas initCanvas={(app) => initApp(app)} className="h-full" /> */}
        </VStack>
    );
}
