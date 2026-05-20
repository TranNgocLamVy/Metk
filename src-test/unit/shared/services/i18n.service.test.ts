import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
}));

import i18n, { i18nService } from "@/shared/services/i18n.service";

describe("i18nService", () => {
    beforeEach(async () => {
        await i18nService.changeLanguage("en");
    });

    it("translates bundled keys and falls back to the key for missing text", () => {
        expect(i18nService.t("global.action.cancel")).toBeTruthy();
        expect(i18nService.t("test.missing.key")).toBe("test.missing.key");
    });

    it("adds runtime resources and switches language through the shared i18n instance", async () => {
        i18nService.addResources("en", "translation", {
            tests: {
                runtime: "Runtime translation",
            },
        });

        await i18nService.changeLanguage("en");

        expect(i18n.language).toBe("en");
        expect(i18nService.t("tests.runtime")).toBe("Runtime translation");
    });

    it("translates backend errors with an explicit fallback when the code is unknown", () => {
        expect(i18nService.tBackendError("unknown-test-code", "Readable backend failure")).toBe("Readable backend failure");
    });
});
