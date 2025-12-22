import { type } from "arktype";

export const ViewStateSchema = type({
    x: "number | null",
    y: "number | null",
    zoom: "number",
});
export type ViewState = typeof ViewStateSchema.infer