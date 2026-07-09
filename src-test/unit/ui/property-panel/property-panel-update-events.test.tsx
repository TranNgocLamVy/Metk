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
vi.mock("@/application/actions/workspace.actions", () => propertyPanelMocks.workspaceService);

import PropertyPanel from "@/ui/workspace/properties-panel/PropertyPanel";
import { getProjectStoreState, resetProjectStoreForTest, setProjectStoreStateForTest } from "@/ui/stores/project.store";
import { getPropertyStoreState, resetPropertyStoreForTest, setPropertyStoreStateForTest } from "@/ui/stores/property.store";
import { getWorkspaceStoreState, resetWorkspaceStoreForTest, setWorkspaceStoreStateForTest } from "@/ui/stores/workspace.store";
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

    setPropertyStoreStateForTest({ objectId: object.objectId, version: 0 });
    getProjectStoreState().actions.setActiveProject(project as any);
    getWorkspaceStoreState().actions.setActiveWorkspace(workspace as any);

    return { object, project, workspace };
}

describe("PropertyPanel updateProperty events", () => {
    beforeEach(() => {
        setPropertyStoreStateForTest({ objectId: null, version: 0 });
        getProjectStoreState().actions.setActiveProject(null);
        getWorkspaceStoreState().actions.setActiveWorkspace(null);
    });

    it("ignores preview updates and refreshes for committed changes", async () => {
        const { object } = createPanelHarness();
        const onSpy = vi.spyOn(object.eventEmitter, "on");

        render(<PropertyPanel />);

        await waitFor(() => {
            expect(onSpy).toHaveBeenCalledWith("updateProperty", expect.any(Function));
        });

        const initialVersion = getPropertyStoreState().version;

        act(() => {
            object.eventEmitter.emit("updateProperty", "name", "Preview", {
                origin: "preview",
                source: "PropertyPanel.test",
            });
        });

        expect(getPropertyStoreState().version).toBe(initialVersion);

        for (const origin of ["commit", "undo", "redo", "external"] as const) {
            const previousVersion = getPropertyStoreState().version;

            act(() => {
                object.eventEmitter.emit("updateProperty", "name", origin, {
                    origin,
                    source: "PropertyPanel.test",
                });
            });

            expect(getPropertyStoreState().version).toBe(previousVersion + 1);
        }
    });
});
