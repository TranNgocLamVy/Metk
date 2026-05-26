import { v4 as uuidv4 } from "uuid";
import { type } from "arktype";

import { SelectionStateSchema } from "./selection-state.schema";
import { ViewStateSchema } from "./view-state.schema";
import { safeArray } from "./utils";

export const TilesetSessionSchema = type({
    id: "string",
    tilesetId: "string",
    viewState: ViewStateSchema.or("null").default(null),
    selectionState: SelectionStateSchema.or("null").default(null),
});
export type TilesetSessionData = typeof TilesetSessionSchema.infer


export const TilesetSessionManagerSchema = type({
    tilesetSessions: safeArray(TilesetSessionSchema).default(() => []),
    currentTilesetSessionId: type("string").or("null").default(null),
})
export type TilesetSessionManagerData = typeof TilesetSessionManagerSchema.infer


export const defaultTilesetSessionData = (tilesetId: string): TilesetSessionData => {
    return {
        id: uuidv4(),
        tilesetId: tilesetId,
        viewState: { x: null, y: null, zoom: 1 },
        selectionState: { selectedTilesSet: [] },
    }
}