


declare global {
    type Point2D = { x: number; y: number };
    type Coordinate = { row: number; col: number };
    type Size = { width: number; height: number };
    type TranslatableMessage = {
        key: string;
        options?: Record<string, any>;
    } | string;
}

export { };

