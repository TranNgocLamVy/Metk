import { Viewport } from "pixi-viewport";
import { Graphics, Point } from "pixi.js";

import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { DrawDashLineOption, DrawLineOption, GraphicUtils } from "@/shared/utils/graphic-utils";

type CreateGridRendererContext = {
    viewport: Viewport;
    tilemap: Tilemap;
}

export class TilemapGridRenderer {
    public readonly graphics: Graphics;
    private viewport: Viewport;
    private tilemap: Tilemap;
    public gridEnabled: boolean = true;

    private bindDrawGrid: () => void;

    constructor(context: CreateGridRendererContext) {
        this.viewport = context.viewport;
        this.tilemap = context.tilemap;

        this.graphics = new Graphics();

        this.bindDrawGrid = this.drawGrid.bind(this);

        // wait for the viewport to be initialized
        setTimeout(() => {
            this.viewport.on("moved", this.bindDrawGrid);
            this.viewport.on("zoomed", this.bindDrawGrid);
            this.viewport.on("resize", this.bindDrawGrid);
            this.drawGrid();
        }, 100);

    }

    private drawGrid(): void {
        this.graphics.clear();
        if (!this.gridEnabled) return;

        const topLeft = new Point(this.viewport.left, this.viewport.top);
        const bottomRight = new Point(this.viewport.right, this.viewport.bottom)

        let stepX = this.tilemap.tilewidth, stepY = this.tilemap.tileheight;
        let minX = Math.floor(topLeft.x / stepX) * stepX;
        let minY = Math.floor(topLeft.y / stepY) * stepY;
        let maxX = Math.ceil(bottomRight.x / stepX) * stepX;
        let maxY = Math.ceil(bottomRight.y / stepY) * stepY;
        let numLine = Math.ceil((maxX - minX) / stepX) + Math.ceil((maxY - minY) / stepY);

        const maxNumLine = 250;
        while (numLine > maxNumLine) {
            stepX *= 2; stepY *= 2;
            minX = Math.floor(topLeft.x / stepX) * stepX;
            minY = Math.floor(topLeft.y / stepY) * stepY;
            maxX = Math.ceil(bottomRight.x / stepX) * stepX;
            maxY = Math.ceil(bottomRight.y / stepY) * stepY;
            numLine = Math.ceil((maxX - minX) / stepX) + Math.ceil((maxY - minY) / stepY);
        }

        const scaled = this.viewport.scaled;
        const bigGridOption: DrawDashLineOption = { dash: [4 / scaled, 2 / scaled], color: 0xc9c9c9, alpha: 0.4, pixelLine: true }
        const smallGridOption: DrawLineOption = { color: 0xc9c9c9, alpha: 0.25, pixelLine: true }

        // Draw grid
        for (let x = minX; x <= maxX; x += stepX) {
            if (x % (stepX * 4) == 0) {
                if (x % (stepX * 8) == 0) {
                    GraphicUtils.drawVerticelDashLine(this.graphics, x, minY, maxY, { ...bigGridOption, alpha: 0.6 });
                } else if (x % (stepX * 16) == 0) {
                    GraphicUtils.drawVerticelDashLine(this.graphics, x, minY, maxY, { ...bigGridOption, alpha: 0.8 });
                } else {
                    GraphicUtils.drawVerticelDashLine(this.graphics, x, minY, maxY, bigGridOption);
                }
            } else {
                GraphicUtils.drawVerticelLine(this.graphics, x, minY, maxY, smallGridOption);
            }
        }
        for (let y = minY; y <= maxY; y += stepY) {
            if (y % (stepY * 4) == 0) {
                if (y % (stepY * 8) == 0) {
                    GraphicUtils.drawHorizontalDashLine(this.graphics, y, minX, maxX, { ...bigGridOption, alpha: 0.6 });
                } else if (y % (stepY * 16) == 0) {
                    GraphicUtils.drawHorizontalDashLine(this.graphics, y, minX, maxX, { ...bigGridOption, alpha: 0.8 });
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