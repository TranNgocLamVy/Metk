import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";

describe("useTilesetSessionStore", () => {
    beforeEach(() => {
        resetStore(useTilesetSessionStore);
    });

    it("initializes without a Pixi app, sessions, or active session", () => {
        expect(useTilesetSessionStore.getState()).toMatchObject({
            pixiApp: null,
            tilesetSessions: [],
            activeSession: null,
        });
    });

    it("sets the Pixi app", () => {
        const pixiApp = { renderer: {} } as any;

        useTilesetSessionStore.getState().setPixiApp(pixiApp);

        expect(useTilesetSessionStore.getState().pixiApp).toBe(pixiApp);
    });

    it("sets tileset session display data", () => {
        const sessions = [{ sessionId: "session-1", name: "Tileset One" }];

        useTilesetSessionStore.getState().setTilesetSessions(sessions);

        expect(useTilesetSessionStore.getState().tilesetSessions).toBe(sessions);
    });

    it("sets the active tileset session", () => {
        const session = { id: "session-1" } as any;

        useTilesetSessionStore.getState().setActiveSession(session);
        expect(useTilesetSessionStore.getState().activeSession).toBe(session);

        useTilesetSessionStore.getState().setActiveSession(null);
        expect(useTilesetSessionStore.getState().activeSession).toBeNull();
    });
});
