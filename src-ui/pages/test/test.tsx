import { Viewport } from "pixi-viewport";
import { Application, Container, Point, Sprite, Texture } from "pixi.js";
import { useRef, useState } from "react";

import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";
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

	const test = async () => {
		const filePath = await openDialog();
		if (!filePath || !viewport) return;

        const tilemap = await DefaultTilemap.loadTilemap(filePath);
        console.log(tilemap);
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
			<Button onClick={test}>Load & Test</Button>
			<Canvas initCanvas={(app) => initApp(app)} className="h-full" />
		</VStack>
	);
}
