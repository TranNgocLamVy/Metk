import { v4 as uuidv4 } from "uuid";
import { type } from "arktype";

import { ViewStateSchema } from "./view-state.schema";
import { safeArray } from "./utils";

export const LayerStateSchema = type({
    selectedLayers: safeArray(type("string")).default(() => []),
})
export type LayerState = typeof LayerStateSchema.infer

export const TilemapSessionSchema = type({
    id: "string",
    tilemapId: "string",
    viewState: ViewStateSchema.optional(),
    layerState: LayerStateSchema.optional(),
});
export type TilemapSessionData = typeof TilemapSessionSchema.infer

export const TilemapSessionManagerSchema = type({
    tilemapSessions: safeArray(TilemapSessionSchema).default(() => []),
    currentTilemapSessionId: type("string").or("null").default(null),
})
export type TilemapSessionManagerData = typeof TilemapSessionManagerSchema.infer

export const defaultTilemapSessionData = (tilemapId: string): TilemapSessionData => {
    return {
        id: uuidv4(),
        tilemapId: tilemapId,
        viewState: { x: null, y: null, zoom: 1 },
        layerState: { selectedLayers: [] },
    }
}