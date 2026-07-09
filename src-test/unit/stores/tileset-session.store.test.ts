import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getTilesetSessionStoreState, resetTilesetSessionStoreForTest, setTilesetSessionStoreStateForTest } from "@/ui/stores/tileset-session.store";

describe("useTilesetSessionStore", () => {
    beforeEach(() => {
        resetTilesetSessionStoreForTest();
    });

    it("initializes without a Pixi app, sessions, or active session", () => {
        expect(getTilesetSessionStoreState()).toMatchObject({
            pixiApp: null,
            tilesetSessions: [],
            activeSession: null,
        });
    });

    it("sets the Pixi app", () => {
        const pixiApp = { renderer: {} } as any;

        getTilesetSessionStoreState().actions.setPixiApp(pixiApp);

        expect(getTilesetSessionStoreState().pixiApp).toBe(pixiApp);
    });

    it("sets tileset session display data", () => {
        const sessions = [{ sessionId: "session-1", name: "Tileset One" }];

        getTilesetSessionStoreState().actions.setTilesetSessions(sessions);

        expect(getTilesetSessionStoreState().tilesetSessions).toBe(sessions);
    });

    it("sets the active tileset session", () => {
        const session = { id: "session-1" } as any;

        getTilesetSessionStoreState().actions.setActiveSession(session);
        expect(getTilesetSessionStoreState().activeSession).toBe(session);

        getTilesetSessionStoreState().actions.setActiveSession(null);
        expect(getTilesetSessionStoreState().activeSession).toBeNull();
    });
});
