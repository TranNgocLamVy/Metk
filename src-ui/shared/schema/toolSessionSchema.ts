import { type } from "arktype";

export const ToolStateSchema = type({
    currentTool: type("string").or("null").default(null),
})
export type ToolStateData = typeof ToolStateSchema.infer