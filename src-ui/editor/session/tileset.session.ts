import { IViewSession } from "@/editor/interface/base-session.interface";
import { SelectionState } from "@/shared/data-types/selection-state.data";
import { TilesetSessionData } from "@/shared/data-types/tileset-session.data";
import { createDefaultViewState, ViewState } from "@/shared/data-types/view-state.data";

import { EditorFacade } from "@/application/editor.facade";
import EventEmitter from "eventemitter3";
import { Tileset } from "../model/tileset/tileset";

interface TilesetSessionEvents {

}

export class TilesetSession extends EventEmitter<TilesetSessionEvents> implements IViewSession {
    public readonly id: string;
    public readonly tileset: Tileset;
    public viewState: ViewState;
    public selectionState: SelectionState;

    constructor(tileset: Tileset, tilesetSessionData: TilesetSessionData, public readonly editorFacade: EditorFacade) {
        super();
        this.tileset = tileset;
        this.id = tilesetSessionData.id;
        this.viewState = tilesetSessionData.viewState ?? createDefaultViewState();
        this.selectionState = { selectedTilesSet: this.normalizeSelectedTileIds(tilesetSessionData.selectionState) } 

    }

    public async loadTilesetSession(): Promise<void> {
        const textureManager = this.editorFacade.textureManager;
        await textureManager.retainTilesetGraphics(this.tileset);
    }

    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }

    public updateSelectionState(state: Partial<SelectionState>) {
        this.selectionState = { ...this.selectionState, ...state };
    }

    private normalizeSelectedTileIds(selectionState: SelectionState | null): number[] {
        if (!selectionState) return [];
        const { selectedTilesSet } = selectionState;
        if (!Array.isArray(selectedTilesSet)) return [];

        const sanitized: number[] = [];

        selectedTilesSet.forEach((tileId) => {
            if (!this.tileset.getCoordinatesFromTile(tileId)) return;
            sanitized.push(tileId);
        });

        return sanitized;
    }


    public serialize(): TilesetSessionData {
        const selectionState: SelectionState = {
            selectedTilesSet: this.selectionState.selectedTilesSet,
        }
        return {
            id: this.id,
            tilesetId: this.tileset.id,
            viewState: this.viewState,
            selectionState: selectionState,
        }
    }

    public destroy(): void {
        const textureManager = this.editorFacade.textureManager;
        textureManager.releaseTilesetGraphics(this.tileset.id); // TODO: Move this to view
    }
}