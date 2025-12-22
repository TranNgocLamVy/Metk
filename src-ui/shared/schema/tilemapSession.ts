import { type } from "arktype";

import { ViewStateSchema } from "./common/viewState";

export const TilemapSessionSchema = type({
    id: "string",
    tilemapId: "string",
    viewState: ViewStateSchema,
});
export type TilemapSessionData = typeof TilemapSessionSchema.infer

export const TilemapSessionManagerSchema = type({
    tilemapSessions: TilemapSessionSchema.array(),
    currentTilemapSessionId: "string | null",
})
export type TilemapSessionManagerData = typeof TilemapSessionManagerSchema.infer