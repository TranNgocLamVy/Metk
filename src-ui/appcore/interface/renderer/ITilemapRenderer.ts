import { Container } from "pixi.js";

import { ITilemap } from "../tile/ITilemap";

export type CreateTilemapRendererContext = {
    tilemap: ITilemap;
}

export interface ITilemapRenderer {
    initRenderer(container: Container): void;
}

export interface ITilemapRendererContructor {
    createTilemapRenderer(context: CreateTilemapRendererContext): ITilemapRenderer;
}