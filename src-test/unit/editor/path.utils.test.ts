import { describe, expect, it } from "vitest";

import { PathUtils } from "@/shared/utils/path.utils";

describe("PathUtils", () => {
    it("can be imported and used without the Tauri path plugin being available", () => {
        expect(PathUtils.join("project", ".metk", "project.json")).toBe("project/.metk/project.json");
        expect(PathUtils.basename("project/.metk/project.json")).toBe("project.json");
        expect(PathUtils.dirname("project/.metk/project.json")).toBe("project/.metk");
        expect(PathUtils.extname("project/.metk/project.json")).toBe(".json");
    });

    it("exposes a synchronous platform separator for code that formats display paths", () => {
        expect(["/", "\\"]).toContain(PathUtils.separator);
        expect(PathUtils.toUserFriendlyPath("project/.metk/project.json")).toBe(
            PathUtils.separator === "\\" ? "project\\.metk\\project.json" : "project/.metk/project.json",
        );
    });
});
