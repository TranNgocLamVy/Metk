import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useTilemapSessionStore } from "@/ui/stores/tilemap-session.store";

describe("useTilemapSessionStore", () => {
    beforeEach(() => {
        resetStore(useTilemapSessionStore);
    });

    it("initializes without a Pixi app, sessions, or active session", () => {
        expect(useTilemapSessionStore.getState()).toMatchObject({
            pixiApp: null,
            tilemapSessions: [],
            activeSession: null,
        });
    });

    it("sets the Pixi app", () => {
        const pixiApp = { renderer: {} } as any;

        useTilemapSessionStore.getState().setPixiApp(pixiApp);

        expect(useTilemapSessionStore.getState().pixiApp).toBe(pixiApp);
    });

    it("sets tilemap session display data", () => {
        const sessions = [{ name: "Map One", sessionId: "session-1", isDirty: true }];

        useTilemapSessionStore.getState().setTilemapSessions(sessions);

        expect(useTilemapSessionStore.getState().tilemapSessions).toBe(sessions);
    });

    it("sets the active tilemap session", () => {
        const session = { id: "session-1" } as any;

        useTilemapSessionStore.getState().setActiveSession(session);
        expect(useTilemapSessionStore.getState().activeSession).toBe(session);

        useTilemapSessionStore.getState().setActiveSession(null);
        expect(useTilemapSessionStore.getState().activeSession).toBeNull();
    });
});
