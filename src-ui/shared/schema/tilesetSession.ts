import { type } from "arktype";

export const ViewStateSchema = type({
    x: "number",
    y: "number",
    zoom: "number",
});
export type ViewState = typeof ViewStateSchema.infer

export const TilesetSessionSchema = type({
    id: "string",
    tilesetId: "string",
    viewState: ViewStateSchema,
});
export type TilesetSessionData = typeof TilesetSessionSchema.infer


export const TilesetSessionManagerSchema = type({
    tilesetSessions: TilesetSessionSchema.array(),
    currentTilesetSessionId: "string | null",
})
export type TilesetSessionManagerData = typeof TilesetSessionManagerSchema.infer