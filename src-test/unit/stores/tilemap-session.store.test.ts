import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getTilemapSessionStoreState, resetTilemapSessionStoreForTest, setTilemapSessionStoreStateForTest } from "@/ui/stores/tilemap-session.store";

describe("useTilemapSessionStore", () => {
    beforeEach(() => {
        resetTilemapSessionStoreForTest();
    });

    it("initializes without a Pixi app, sessions, or active session", () => {
        expect(getTilemapSessionStoreState()).toMatchObject({
            pixiApp: null,
            tilemapSessions: [],
            activeSession: null,
        });
    });

    it("sets the Pixi app", () => {
        const pixiApp = { renderer: {} } as any;

        getTilemapSessionStoreState().actions.setPixiApp(pixiApp);

        expect(getTilemapSessionStoreState().pixiApp).toBe(pixiApp);
    });

    it("sets tilemap session display data", () => {
        const sessions = [{ name: "Map One", sessionId: "session-1", isDirty: true }];

        getTilemapSessionStoreState().actions.setTilemapSessions(sessions);

        expect(getTilemapSessionStoreState().tilemapSessions).toBe(sessions);
    });

    it("sets the active tilemap session", () => {
        const session = { id: "session-1" } as any;

        getTilemapSessionStoreState().actions.setActiveSession(session);
        expect(getTilemapSessionStoreState().activeSession).toBe(session);

        getTilemapSessionStoreState().actions.setActiveSession(null);
        expect(getTilemapSessionStoreState().activeSession).toBeNull();
    });
});
