import { Application } from "pixi.js";

import { TilesetSession } from "@/core/application/session/tilesetSession";

import { TilesetSessionView } from "./tilesetSessionView";

class TilesetRenderManager {
    private cache: Map<string, TilesetSessionView> = new Map();

    public async getSessionView(session: TilesetSession, app: Application): Promise<TilesetSessionView> {
        if (this.cache.has(session.id)) {
            return this.cache.get(session.id)!;
        }
        await session.tileset.loadTexture();
        const viewGroup = new TilesetSessionView(session, app);
        this.cache.set(session.id, viewGroup);
        return viewGroup;
    }

    public disposeSession(sessionId: string) {
        const view = this.cache.get(sessionId);
        if (view) {
            view.destroy();
            this.cache.delete(sessionId);
        }
    }

    public clear() {
        this.cache.forEach(view => view.destroy());
        this.cache.clear();
    }
}

export const tilesetRenderManager = new TilesetRenderManager();