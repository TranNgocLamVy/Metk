import { Graphics } from "pixi.js";

export class GraphicUtils {
    public static drawVerticelLine(graphics: Graphics, startX: number, startY: number, endY: number, options: DrawLineOption) {
        graphics.moveTo(startX, startY);
        graphics.lineTo(startX, endY);
        graphics.stroke({ color: options.color, alpha: options.alpha, pixelLine: options.pixelLine });
    }

    public static drawHorizontalLine(graphics: Graphics, startY: number, startX: number, endX: number, options: DrawLineOption) {
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, startY);
        graphics.stroke({ color: options.color, alpha: options.alpha, pixelLine: options.pixelLine });
    }

    public static drawVerticelDashLine(graphics: Graphics, startX: number, startY: number, endY: number, options: DrawDashLineOption) {
        graphics.moveTo(startX, startY);
        let currentY = startY;
        while (currentY <= endY) {
            graphics.moveTo(startX, currentY);
            graphics.lineTo(startX, Math.min(currentY + options.dash[0], endY));
            currentY += options.dash[0] + options.dash[1];
        }
        graphics.stroke({ color: options.color, alpha: options.alpha, pixelLine: options.pixelLine });
    }

    public static drawHorizontalDashLine(graphics: Graphics, startY: number, startX: number, endX: number, options: DrawDashLineOption) {
        graphics.moveTo(startX, startY);
        let currentX = startX;
        while (currentX <= endX) {
            graphics.moveTo(currentX, startY);
            graphics.lineTo(Math.min(currentX + options.dash[0], endX), startY);
            currentX += options.dash[0] + options.dash[1];
        }
        graphics.stroke({ color: options.color, alpha: options.alpha, pixelLine: options.pixelLine });
    }
}

export type DrawLineOption = {
    pixelLine?: boolean
    color?: number
    alpha?: number
}

export type DrawDashLineOption = DrawLineOption & {
    dash: [number, number];
}