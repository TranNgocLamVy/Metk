import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Tileset } from "@/editor/model/tileset/tileset";
import { useDialogStore } from "@/ui/stores/dialog.store";

export function useTilesetController(initialTileset: Tileset, dialogId: string) {
    const { closeDialog } = useDialogStore();

    const [version, setVersion] = useState(0);
    const [tileset] = useState<Tileset>(initialTileset);
    const [tilesetName, setTilesetName] = useState(initialTileset.name);
    const [selectedTileId, setSelectedTileId] = useState<number | null>(
        initialTileset.tiles[0]?.id ?? null,
    );

    const selectedTile = useMemo(() => {
        if (selectedTileId == null) return null;
        return tileset.getTileFromId(selectedTileId);
    }, [tileset, selectedTileId, version]);

    const triggerUpdate = useCallback(() => {
        setVersion((value) => value + 1);
    }, []);

    const selectTile = useCallback((tileId: number | null) => {
        setSelectedTileId(tileId);
    }, []);

    const updateTilesetName = useCallback((name: string) => {
        setTilesetName(name);
    }, []);

    const handleCloseDialog = useCallback(() => {
        closeDialog(dialogId);
    }, [closeDialog, dialogId]);

    const updateTileset = useCallback(async () => {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return;

        const finalName = tilesetName.trim();

        if (finalName.length > 0) {
            tileset.name = finalName;
        }

        const tilesetManager = currentProject.tilesetManager;

        tilesetManager.updateTileset(tileset.serialize());
        await tilesetManager.saveTileset(tileset.id);
        await appKernel.editorFacade.projectManager.saveCurrrentProject();

        closeDialog(dialogId);
    }, [tileset, tilesetName, closeDialog, dialogId]);

    const actions = useMemo(() => ({
        triggerUpdate,
        selectTile,
        updateTilesetName,
        closeDialog: handleCloseDialog,
        updateTileset,
    }), [triggerUpdate, selectTile, updateTilesetName, handleCloseDialog, updateTileset]);

    return {
        version,
        triggerUpdate,

        tileset,
        tilesetName,
        selectedTileId,
        selectedTile,

        actions,
    };
}

export type EditTilesetContextType = ReturnType<typeof useTilesetController>;

export const EditTilesetContext = createContext<EditTilesetContextType | null>(null);

export const useEditTileset = () => {
    const context = useContext(EditTilesetContext);
    if (!context) throw new Error("useEditTileset must be used within an EditTilesetProvider");
    return context;
};
