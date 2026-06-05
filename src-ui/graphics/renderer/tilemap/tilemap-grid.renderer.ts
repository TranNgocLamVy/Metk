import { Viewport } from "pixi-viewport";
import { Graphics, Point } from "pixi.js";

import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { DrawDashLineOption, DrawLineOption, GraphicUtils } from "@/shared/utils/graphic-utils";

const GRID_INIT_DELAY_MS = 100;
const MAX_VISIBLE_GRID_LINES = 250;
const GRID_COARSENING_FACTOR = 2;
const MAJOR_GRID_INTERVAL = 4;
const STRONG_GRID_INTERVAL = 8;
const STRONGEST_GRID_INTERVAL = 16;
const GRID_DASH_LENGTH = 4;
const GRID_DASH_GAP = 2;
const GRID_LINE_COLOR = 0xc9c9c9;
const BIG_GRID_ALPHA = 0.4;
const SMALL_GRID_ALPHA = 0.25;
const STRONG_GRID_ALPHA = 0.6;
const STRONGEST_GRID_ALPHA = 0.8;

type CreateGridRendererContext = {
    viewport: Viewport;
    tilemap: Tilemap;
    gridEnabled?: boolean;
}

export class TilemapGridRenderer {
    public readonly graphics: Graphics;
    private viewport: Viewport;
    private tilemap: Tilemap;
    public gridEnabled: boolean = false;

    private bindDrawGrid: () => void;

    constructor(context: CreateGridRendererContext) {
        this.viewport = context.viewport;
        this.tilemap = context.tilemap;
        this.gridEnabled = context.gridEnabled ?? false;

        this.graphics = new Graphics();

        this.bindDrawGrid = this.drawGrid.bind(this);

        // wait for the viewport to be initialized
        setTimeout(() => {
            this.viewport.on("moved", this.bindDrawGrid);
            this.viewport.on("zoomed", this.bindDrawGrid);
            this.viewport.on("resize", this.bindDrawGrid);
            this.drawGrid();
        }, GRID_INIT_DELAY_MS);

    }

    private drawGrid(): void {
        this.graphics.clear();
        if (!this.gridEnabled) return;

        const topLeft = new Point(this.viewport.left, this.viewport.top);
        const bottomRight = new Point(this.viewport.right, this.viewport.bottom)

        let stepX = this.tilemap.tileWidth, stepY = this.tilemap.tileHeight;
        let minX = Math.floor(topLeft.x / stepX) * stepX;
        let minY = Math.floor(topLeft.y / stepY) * stepY;
        let maxX = Math.ceil(bottomRight.x / stepX) * stepX;
        let maxY = Math.ceil(bottomRight.y / stepY) * stepY;
        let numLine = Math.ceil((maxX - minX) / stepX) + Math.ceil((maxY - minY) / stepY);

        while (numLine > MAX_VISIBLE_GRID_LINES) {
            stepX *= GRID_COARSENING_FACTOR; stepY *= GRID_COARSENING_FACTOR;
            minX = Math.floor(topLeft.x / stepX) * stepX;
            minY = Math.floor(topLeft.y / stepY) * stepY;
            maxX = Math.ceil(bottomRight.x / stepX) * stepX;
            maxY = Math.ceil(bottomRight.y / stepY) * stepY;
            numLine = Math.ceil((maxX - minX) / stepX) + Math.ceil((maxY - minY) / stepY);
        }

        const scaled = this.viewport.scaled;
        const bigGridOption: DrawDashLineOption = { dash: [GRID_DASH_LENGTH / scaled, GRID_DASH_GAP / scaled], color: GRID_LINE_COLOR, alpha: BIG_GRID_ALPHA, pixelLine: true }
        const smallGridOption: DrawLineOption = { color: GRID_LINE_COLOR, alpha: SMALL_GRID_ALPHA, pixelLine: true }

        // Draw grid
        for (let x = minX; x <= maxX; x += stepX) {
            if (x % (stepX * MAJOR_GRID_INTERVAL) == 0) {
                if (x % (stepX * STRONG_GRID_INTERVAL) == 0) {
                    GraphicUtils.drawVerticelDashLine(this.graphics, x, minY, maxY, { ...bigGridOption, alpha: STRONG_GRID_ALPHA });
                } else if (x % (stepX * STRONGEST_GRID_INTERVAL) == 0) {
                    GraphicUtils.drawVerticelDashLine(this.graphics, x, minY, maxY, { ...bigGridOption, alpha: STRONGEST_GRID_ALPHA });
                } else {
                    GraphicUtils.drawVerticelDashLine(this.graphics, x, minY, maxY, bigGridOption);
                }
            } else {
                GraphicUtils.drawVerticelLine(this.graphics, x, minY, maxY, smallGridOption);
            }
        }
        for (let y = minY; y <= maxY; y += stepY) {
            if (y % (stepY * MAJOR_GRID_INTERVAL) == 0) {
                if (y % (stepY * STRONG_GRID_INTERVAL) == 0) {
                    GraphicUtils.drawHorizontalDashLine(this.graphics, y, minX, maxX, { ...bigGridOption, alpha: STRONG_GRID_ALPHA });
                } else if (y % (stepY * STRONGEST_GRID_INTERVAL) == 0) {
                    GraphicUtils.drawHorizontalDashLine(this.graphics, y, minX, maxX, { ...bigGridOption, alpha: STRONGEST_GRID_ALPHA });
                } else {
                    GraphicUtils.drawHorizontalDashLine(this.graphics, y, minX, maxX, bigGridOption);
                }
            } else {
                GraphicUtils.drawHorizontalLine(this.graphics, y, minX, maxX, smallGridOption);
            }
        }
    }

    public disableGrid(): void {
        this.gridEnabled = false;
        this.graphics.clear();
    }

    public enableGrid(): void {
        this.gridEnabled = true;
        this.drawGrid();
    }
}