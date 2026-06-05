import { v4 as uuidv4 } from "uuid";
import { createDefaultViewState, ViewState } from "./view-state.data";

export type LayerState = {
    selectedLayers: string[];
};

export type TilemapSessionData = {
    id: string;
    tilemapId: string;
    viewState?: ViewState;
    layerState?: LayerState;
};

export type TilemapSessionManagerData = {
    tilemapSessions: TilemapSessionData[];
    currentTilemapSessionId: string | null;
};

export const defaultTilemapSessionData = (tilemapId: string): TilemapSessionData => {
    return {
        id: uuidv4(),
        tilemapId: tilemapId,
        viewState: createDefaultViewState(),
        layerState: { selectedLayers: [] },
    };
};
