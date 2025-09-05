import { Viewport } from "pixi-viewport";
import { Application, Container, Point, Sprite, Texture } from "pixi.js";
import { useRef, useState } from "react";

import { DefaultTileset } from "@/appcore/default/tile/defaultTileset";
import { VStack } from "@/components/custom/Stack/Stack";
import Canvas from "@/components/drawing/Canvas/Canvas";
import { Button } from "@/components/shadcn/button";
import { useExtend } from "@pixi/react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

export default function TestPage() {
    useExtend({ Sprite });

    const [app, setApp] = useState<Application | null>(null);
    const [viewport, setViewport] = useState<Viewport | null>(null);

    // Keep a registry of sprites laid out in grid order (index === slot)
    const spritesRef = useRef<Sprite[]>([]);

    // Grid meta (set after loading a tileset)
    const gridMetaRef = useRef({
        tileWidth: 0,
        tileHeight: 0,
        columns: 0,
        gap: 1,
    });

    // ===== Grid helpers =====
    const indexToPos = (index: number) => {
        const { tileWidth, tileHeight, columns, gap } = gridMetaRef.current;
        const x = (index % columns) * (tileWidth + gap);
        const y = Math.floor(index / columns) * (tileHeight + gap);
        return { x, y };
    };

    const posToIndex = (x: number, y: number) => {
        const { tileWidth, tileHeight, columns, gap } = gridMetaRef.current;
        if (tileWidth <= 0 || tileHeight <= 0 || columns <= 0) return -1;

        const cellW = tileWidth + gap;
        const cellH = tileHeight + gap;

        if (x < 0 || y < 0) return -1;

        const col = Math.floor(x / cellW);
        const row = Math.floor(y / cellH);
        if (col < 0 || row < 0) return -1;

        return row * columns + col;
    };

    // ===== Drag state =====
    type DragState = {
        sprite: Sprite;
        startIndex: number;
        offset: Point; // pointer-to-sprite registration offset
        placeholder?: Sprite;
    } | null;

    const dragRef = useRef<DragState>(null);

    // ===== Sprite factory with drag handlers =====
    const makeSprite = (texture: Texture, index: number, gridContainer: Container) => {
        const s = new Sprite(texture);
        s.eventMode = "dynamic"; // v8 replacement for interactive=true
        s.cursor = "grab";
        s.zIndex = 0;

        const { x, y } = indexToPos(index);
        s.position.set(x, y);

        const onPointerDown = (e: any) => {
            if (!viewport) return;
            s.cursor = "grabbing";
            s.alpha = 0.8;
            s.zIndex = 9999;

            // compute world -> local point to keep the drag registration
            const world = new Point(e.globalX, e.globalY);
            const localInViewport = viewport.toLocal(world);
            const offset = new Point(localInViewport.x - s.x, localInViewport.y - s.y);

            const startIndex = spritesRef.current.indexOf(s);

            // optional: lightweight placeholder outline to visualize snap
            const placeholder = new Sprite(Texture.WHITE);
            placeholder.tint = 0xffffff;
            placeholder.alpha = 0.15;
            placeholder.width = gridMetaRef.current.tileWidth;
            placeholder.height = gridMetaRef.current.tileHeight;
            const { x: px, y: py } = indexToPos(startIndex);
            placeholder.position.set(px, py);
            placeholder.zIndex = 1;
            gridContainer.addChild(placeholder);

            dragRef.current = { sprite: s, startIndex, offset, placeholder };

            // listen on viewport for move/up to keep consistent during panning/zooming
            viewport.on("pointermove", onPointerMove);
            viewport.on("pointerup", onPointerUp);
            viewport.on("pointerupoutside", onPointerUp);
        };

        const onPointerMove = (e: any) => {
            if (!viewport) return;
            const drag = dragRef.current;
            if (!drag || drag.sprite !== s) return;

            const world = new Point(e.globalX, e.globalY);
            const local = viewport.toLocal(world);

            // follow pointer, keeping the original grab offset
            s.position.set(local.x - drag.offset.x, local.y - drag.offset.y);

            // snap preview (move placeholder to hovered cell)
            const hoveredIndex = posToIndex(local.x, local.y);
            if (drag.placeholder && hoveredIndex >= 0) {
                const { x, y } = indexToPos(hoveredIndex);
                drag.placeholder.position.set(x, y);
            }
        };

        const onPointerUp = (e: any) => {
            if (!viewport) return;
            const drag = dragRef.current;
            if (!drag || drag.sprite !== s) return;

            s.cursor = "grab";
            s.alpha = 1;
            s.zIndex = 0;

            const world = new Point(e.globalX, e.globalY);
            const local = viewport.toLocal(world);
            const targetIndex = posToIndex(local.x, local.y);

            const from = drag.startIndex;
            const to = targetIndex;

            // remove placeholder
            if (drag.placeholder && drag.placeholder.parent) {
                drag.placeholder.parent.removeChild(drag.placeholder);
                drag.placeholder.destroy();
            }

            // perform swap if valid and different
            if (to >= 0 && to < spritesRef.current.length && to !== from) {
                const a = spritesRef.current[from];
                const b = spritesRef.current[to];

                // swap registry entries
                spritesRef.current[from] = b;
                spritesRef.current[to] = a;

                // snap positions to their new slots
                const aPos = indexToPos(to);
                const bPos = indexToPos(from);
                a.position.set(aPos.x, aPos.y);
                b.position.set(bPos.x, bPos.y);
            } else {
                // snap back to original cell
                const { x, y } = indexToPos(from);
                s.position.set(x, y);
            }

            // cleanup listeners
            viewport.off("pointermove", onPointerMove);
            viewport.off("pointerup", onPointerUp);
            viewport.off("pointerupoutside", onPointerUp);

            dragRef.current = null;
        };

        s.on("pointerdown", onPointerDown);

        return s;
    };

    const test = async () => {
        const filePath = await openDialog();
        if (!filePath || !viewport) return;

        const tileset = await DefaultTileset.loadTileset(filePath);
        if (!tileset) return;

        // update grid meta
        gridMetaRef.current = {
            tileWidth: tileset.tilewidth,
            tileHeight: tileset.tileheight,
            columns: tileset.columns,
            gap: 1,
        };

        // clear previous content
        viewport.removeChildren();
        spritesRef.current = [];

        // ensure sorting works for zIndex during drag
        viewport.sortableChildren = true;

        // Create a container to hold sprites (optional but neat)
        const gridContainer = new Container();
        gridContainer.sortableChildren = true;
        viewport.addChild(gridContainer);

        // create sprites in grid order
        tileset.tiles.forEach((tile, index) => {
            const tex = tile.getTexture(); // fixed typo
            const sprite = makeSprite(tex, index, gridContainer);
            spritesRef.current.push(sprite);
            gridContainer.addChild(sprite);
        });
    };

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

        // receive pointer events for drag handlers registered above
        viewport.eventMode = "static";
        viewport.hitArea = app.screen; // ensure it gets pointer events across the canvas

        app.stage.addChild(viewport);
        setViewport(viewport);
    };

    return (
        <VStack className="h-full">
            <Button onClick={test}>Load & Test</Button>
            <Canvas initCanvas={(app) => initApp(app)} className="h-full" />
        </VStack>
    );
}
