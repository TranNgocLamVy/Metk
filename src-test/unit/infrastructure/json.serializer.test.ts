import { describe, expect, it } from "vitest";

import { JsonSerializer } from "@/infrastructure/json.serializer";

describe("JsonSerializer", () => {
    it("serializes deterministic JSON content", () => {
        const serializer = new JsonSerializer<{ name: string; size: number }>();

        const result = serializer.serialize({ name: "Terrain", size: 3 });

        expect(result.status).toBe("Success");
        expect(result.data).toContain('"name": "Terrain"');
        expect(result.data).toContain('"size": 3');
    });

    it("deserializes valid raw JSON", () => {
        const serializer = new JsonSerializer<{ id: string }>();

        expect(serializer.deserialize('{"id":"tilemap-a"}')).toEqual({
            status: "Success",
            data: { id: "tilemap-a" },
        });
    });

    it("returns Result.Error for malformed JSON instead of throwing", () => {
        const serializer = new JsonSerializer<unknown>();

        expect(() => serializer.deserialize("1 2 3")).not.toThrow();
        expect(serializer.deserialize("1 2 3")).toMatchObject({
            status: "Error",
            message: { key: expect.stringContaining("Invalid JSON:") },
        });
    });

    it("does not perform schema validation", () => {
        const objectSerializer = new JsonSerializer<{ id: string }>();
        const numberSerializer = new JsonSerializer<number>();

        expect(objectSerializer.deserialize('{"id":123,"extra":true}')).toEqual({
            status: "Success",
            data: { id: 123, extra: true },
        });
        expect(numberSerializer.deserialize('"not-a-number"')).toEqual({
            status: "Success",
            data: "not-a-number",
        });
    });
});
