import { type } from "arktype";
import { safeArray } from "./utils";

export const collisionObjectKind = type("'box' | 'point' | 'polygon'");
export type CollisionObjectKind = typeof collisionObjectKind.infer;

export const CollisionObjectKind: Record<string, CollisionObjectKind> = {
    Box: "box",
    Point: "point",
    Polygon: "polygon",
};

const baseCollisionSchema = type({
    id: "string",
    kind: collisionObjectKind,
    "name?": "string",
    x: "number",
    y: "number",
    "visible?": "boolean",
    "locked?": "boolean",
});

export type BaseCollisionData = typeof baseCollisionSchema.infer;

const boxCollisionSchema = baseCollisionSchema.merge({
    kind: "'box'",
    width: "number",
    height: "number",
});

export type BoxCollisionData = typeof boxCollisionSchema.infer;

const pointCollisionSchema = baseCollisionSchema.merge({
    kind: "'point'",
});

export type PointCollisionData = typeof pointCollisionSchema.infer;

const point2DSchema = type({
    x: "number",
    y: "number",
});

const polygonCollisionSchema = baseCollisionSchema.merge({
    kind: "'polygon'",
    points: safeArray(point2DSchema),
});

export type PolygonCollisionData = typeof polygonCollisionSchema.infer;

export const collisionObjectSchema = boxCollisionSchema
    .or(pointCollisionSchema)
    .or(polygonCollisionSchema);

export type CollisionObjectData = typeof collisionObjectSchema.infer;