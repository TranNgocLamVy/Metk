import { type } from "arktype";
import { describe, expect, it } from "vitest";

import { ArkTypeJsonSerializer } from "@/infrastructure/arktype-json.serializer";

describe("ArkTypeJsonSerializer", () => {
    it("serializes deterministic JSON content", () => {
        const serializer = new ArkTypeJsonSerializer<{ name: string; size: number }>();

        const result = serializer.serialize({ name: "Terrain", size: 3 });

        expect(result.status).toBe("Success");
        expect(result.data).toContain('"name": "Terrain"');
        expect(result.data).toContain('"size": 3');
    });

    it("deserializes raw JSON when no schema is provided", () => {
        const serializer = new ArkTypeJsonSerializer<{ id: string }>();

        expect(serializer.deserialize('{"id":"tilemap-a"}')).toEqual({
            status: "Success",
            data: { id: "tilemap-a" },
        });
    });

    it("returns schema validation errors from arktype", () => {
        const serializer = new ArkTypeJsonSerializer<number>(type("number"));

        expect(serializer.deserialize('"not-a-number"')).toMatchObject({
            status: "Error",
            message: { key: expect.stringContaining("Data validation failed:") },
        });
    });

    it("throws native JSON parse errors for malformed JSON without a schema", () => {
        const serializer = new ArkTypeJsonSerializer();

        expect(() => serializer.deserialize("{bad json")).toThrow(SyntaxError);
    });
});
