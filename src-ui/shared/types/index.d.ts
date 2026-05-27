


declare global {
    type Position = { x: number; y: number };
    type Coordinate = { row: number; col: number };
    type Size = { width: number; height: number };

    type Point2D = { x: number, y: number };
    type Point3D = { x: number, y: number, z: number };

    type TranslatableMessage = {
        key: string;
        options?: Record<string, any>;
    } | string;
}

export {};