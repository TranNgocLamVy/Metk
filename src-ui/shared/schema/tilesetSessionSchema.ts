import { type } from "arktype";

import { SelectionStateSchema } from "./selectionState";
import { ViewStateSchema } from "./viewState";

export const TilesetSessionSchema = type({
    id: "string",
    tilesetId: "string",
    viewState: ViewStateSchema,
    selectionState: SelectionStateSchema,
});
export type TilesetSessionData = typeof TilesetSessionSchema.infer


export const TilesetSessionManagerSchema = type({
    tilesetSessions: TilesetSessionSchema.array(),
    currentTilesetSessionId: "string | null",
})
export type TilesetSessionManagerData = typeof TilesetSessionManagerSchema.infer