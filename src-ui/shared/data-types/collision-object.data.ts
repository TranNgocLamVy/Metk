export const CollisionObjectKindValues = ["box", "point", "polygon"] as const;
export type CollisionObjectKind = typeof CollisionObjectKindValues[number];

export const CollisionObjectKind = {
    Box: "box",
    Point: "point",
    Polygon: "polygon",
} as const satisfies Record<string, CollisionObjectKind>;

export type BaseCollisionData = {
    id: string;
    kind: CollisionObjectKind;
    name?: string;
    x: number;
    y: number;
    visible?: boolean;
    locked?: boolean;
};

export type BoxCollisionData = BaseCollisionData & {
    kind: "box";
    width: number;
    height: number;
};

export type PointCollisionData = BaseCollisionData & {
    kind: "point";
};

export type PolygonCollisionData = BaseCollisionData & {
    kind: "polygon";
    points: Point2D[];
};

export type CollisionObjectData =
    | BoxCollisionData
    | PointCollisionData
    | PolygonCollisionData;
