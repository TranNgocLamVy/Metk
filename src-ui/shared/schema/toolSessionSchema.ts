import { type } from "arktype";

export const ToolStateSchema = type({
    currentTool: type("string").optional(),
})
export type ToolStateData = typeof ToolStateSchema.infer