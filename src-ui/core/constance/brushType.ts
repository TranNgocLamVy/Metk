export const BrushTypes = {
    Stamp: "Stamp",
    Eraser: "Eraser",
    Fill: "Fill",
    Rectangle: "Rectangle",
} as const;

export type BrushType = typeof BrushTypes[keyof typeof BrushTypes];