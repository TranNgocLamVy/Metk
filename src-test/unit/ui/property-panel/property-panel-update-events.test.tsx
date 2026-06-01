import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const propertyPanelMocks = vi.hoisted(() => ({
    appKernel: {
        projectManager: {
            currentProject: null,
            serialize: vi.fn(() => []),
            on: vi.fn(),
        },
        workspaceManager: {
            currentWorkspace: null,
            on: vi.fn(),
        },
        activationContext: {
            setFlag: vi.fn(),
        },
        editorFacade: {
            objectRegistry: {
                get: vi.fn(),
            },
        },
    },
    workspaceService: {
        saveCurrentWorkspace: vi.fn(),
    },
}));

vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: propertyPanelMocks.appKernel }));
vi.mock("@/shared/services/workspace.service", () => ({ WorkspaceService: propertyPanelMocks.workspaceService }));

import PropertyPanel from "@/ui/workspace/properties-panel/PropertyPanel";
import { useProjectStore } from "@/ui/stores/project.store";
import { usePropertyStore } from "@/ui/stores/property.store";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";
import { BaseObject } from "@/editor/model/base-object";

class PanelObject extends BaseObject {}

function createPanelHarness() {
    const object = new PanelObject("object:panel-test");
    const project = {
        objectRegistry: {
            get: vi.fn((objectId: string) => objectId === object.objectId ? object : undefined),
            on: vi.fn(),
            off: vi.fn(),
        },
    };
    const workspace = {
        propertyPanelManager: {
            getSelectedObjectId: vi.fn(() => object.objectId),
            selectObject: vi.fn(),
        },
    };

    usePropertyStore.setState({ objectId: object.objectId, version: 0 });
    useProjectStore.getState().setActiveProject(project as any);
    useWorkspaceStore.getState().setActiveWorkspace(workspace as any);

    return { object, project, workspace };
}

describe("PropertyPanel updateProperty events", () => {
    beforeEach(() => {
        usePropertyStore.setState({ objectId: null, version: 0 });
        useProjectStore.getState().setActiveProject(null);
        useWorkspaceStore.getState().setActiveWorkspace(null);
    });

    it("ignores preview updates and refreshes for committed changes", async () => {
        const { object } = createPanelHarness();
        const onSpy = vi.spyOn(object.eventEmitter, "on");

        render(<PropertyPanel />);

        await waitFor(() => {
            expect(onSpy).toHaveBeenCalledWith("updateProperty", expect.any(Function));
        });

        const initialVersion = usePropertyStore.getState().version;

        act(() => {
            object.eventEmitter.emit("updateProperty", "name", "Preview", {
                origin: "preview",
                source: "PropertyPanel.test",
            });
        });

        expect(usePropertyStore.getState().version).toBe(initialVersion);

        for (const origin of ["commit", "undo", "redo", "external"] as const) {
            const previousVersion = usePropertyStore.getState().version;

            act(() => {
                object.eventEmitter.emit("updateProperty", "name", origin, {
                    origin,
                    source: "PropertyPanel.test",
                });
            });

            expect(usePropertyStore.getState().version).toBe(previousVersion + 1);
        }
    });
});
