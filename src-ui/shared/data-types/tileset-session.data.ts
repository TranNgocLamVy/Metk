import { v4 as uuidv4 } from "uuid";
import { SelectionState } from "./selection-state.data";
import { createDefaultViewState, ViewState } from "./view-state.data";

export type TilesetSessionData = {
    id: string;
    tilesetId: string;
    viewState: ViewState | null;
    selectionState: SelectionState | null;
};

export type TilesetSessionManagerData = {
    tilesetSessions: TilesetSessionData[];
    currentTilesetSessionId: string | null;
};

export const defaultTilesetSessionData = (tilesetId: string): TilesetSessionData => {
    return {
        id: uuidv4(),
        tilesetId: tilesetId,
        viewState: createDefaultViewState(),
        selectionState: { selectedTilesSet: [] },
    };
};
