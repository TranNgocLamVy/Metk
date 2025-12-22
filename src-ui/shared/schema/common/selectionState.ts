import { type } from "arktype";

export const SelectionStateSchema = type({
    selectedTiles: "(number | null)[][]",
    pivot: type({
        row: "number",
        col: "number",
    }).optional(),
});
export type SelectionState = typeof SelectionStateSchema.infer