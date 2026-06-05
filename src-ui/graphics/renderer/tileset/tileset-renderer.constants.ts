import type { DrawLineOption } from "@/shared/utils/graphic-utils";

export const TILESET_GRID_LINE_OPTIONS = {
    color: 0xc9c9c9,
    alpha: 0.5,
    pixelLine: true,
} as const satisfies DrawLineOption;

export const TILESET_SELECTION_COLOR = 0x0090f1;
export const TILESET_SELECTION_ALPHA = 0.4;
