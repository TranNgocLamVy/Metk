import { beforeEach, describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/types/result";

type KernelTestState = {
    projectMetadataRepo: {
        load: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
    };
    settingStorageService: {
        load: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
    };
    projectManager: {
        load: ReturnType<typeof vi.fn>;
        serialize: ReturnType<typeof vi.fn>;
        currentProject: null;
    };
    workspaceManager: {
        setEditorContext: ReturnType<typeof vi.fn>;
        currentWorkspace: null;
    };
    layoutManager: Record<string, never>;
    toolManager: {
        setEditorContext: ReturnType<typeof vi.fn>;
    };
    textureManager: Record<string, never>;
    constructors: Record<string, ReturnType<typeof vi.fn>>;
};

const loadKernelModule = async () => {
    vi.resetModules();
    delete (globalThis as any).__APP_CORE_INSTANCE__;

    const state: KernelTestState = {
        projectMetadataRepo: {
            load: vi.fn(),
            save: vi.fn(),
        },
        settingStorageService: {
            load: vi.fn(() => Promise.resolve(Result.Error("settings not found"))),
            save: vi.fn(() => Promise.resolve(Result.Success())),
        },
        projectManager: {
            load: vi.fn(),
            serialize: vi.fn(() => [{ id: "project-a", name: "Project A" }]),
            currentProject: null,
        },
        workspaceManager: {
            setEditorContext: vi.fn(),
            currentWorkspace: null,
        },
        layoutManager: {},
        toolManager: {
            setEditorContext: vi.fn(),
        },
        textureManager: {},
        constructors: {
            ProjectManager: vi.fn(),
            WorkspaceManager: vi.fn(),
            LayoutManager: vi.fn(),
            ToolManager: vi.fn(),
            TextureManager: vi.fn(),
            SystemCommandManager: vi.fn(),
            KeybindingManager: vi.fn(),
            ActivationContext: vi.fn(),
        },
    };

    vi.doMock("@/application/command-system/register-commands", () => ({}));
    vi.doMock("@/graphics/tool/register-tool", () => ({}));
    vi.doMock("@/infrastructure/container", () => ({
        ProjectMetadataRepo: state.projectMetadataRepo,
        SettingStorageService: state.settingStorageService,
    }));
    vi.doMock("@/application/resources/project/project.manager", () => ({
        ProjectManager: vi.fn(function () {
            (state.constructors.ProjectManager as any)();
            return state.projectManager;
        }),
    }));
    vi.doMock("@/application/workspace/workspace.manager", () => ({
        WorkspaceManager: vi.fn(function () {
            (state.constructors.WorkspaceManager as any)();
            return state.workspaceManager;
        }),
    }));
    vi.doMock("@/application/layout/layout.manager", () => ({
        LayoutManager: vi.fn(function () {
            (state.constructors.LayoutManager as any)();
            return state.layoutManager;
        }),
    }));
    vi.doMock("@/graphics/tool/tool.manager", () => ({
        ToolManager: vi.fn(function () {
            (state.constructors.ToolManager as any)();
            return state.toolManager;
        }),
    }));
    vi.doMock("@/graphics/texture/texture.manager", () => ({
        TextureManager: vi.fn(function () {
            (state.constructors.TextureManager as any)();
            return state.textureManager;
        }),
    }));
    vi.doMock("@/application/commands/system-command.manager", () => ({
        SystemCommandManager: vi.fn(function () {
            (state.constructors.SystemCommandManager as any)(...arguments);
            return {};
        }),
    }));
    vi.doMock("@/application/input/keybinding.manager", () => ({
        KeybindingManager: vi.fn(function () {
            (state.constructors.KeybindingManager as any)(...arguments);
            return {};
        }),
    }));
    vi.doMock("@/application/runtime/activation-context", () => ({
        ActivationContext: vi.fn(function () {
            (state.constructors.ActivationContext as any)();
            return {};
        }),
    }));

    const module = await import("@/application/bootstrap/app-kernel");
    return { ...module, state };
};

describe("AppKernel", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("initializes a singleton lazily through getIns and preserves it across initialize calls", async () => {
        const { AppKernel, appKernel, state } = await loadKernelModule();

        const first = AppKernel.getIns();
        AppKernel.initialize();
        const second = AppKernel.getIns();

        expect(first).toBe(appKernel);
        expect(second).toBe(first);
        expect(state.constructors.ProjectManager).toHaveBeenCalledTimes(1);
        expect(state.constructors.WorkspaceManager).toHaveBeenCalledTimes(1);
        expect(state.constructors.ToolManager).toHaveBeenCalledTimes(1);
    });

    it("wires editor context into tool and workspace managers during construction", async () => {
        const { appKernel, state } = await loadKernelModule();

        expect(state.toolManager.setEditorContext).toHaveBeenCalledWith(appKernel.editorFacade);
        expect(state.workspaceManager.setEditorContext).toHaveBeenCalledWith(appKernel.editorFacade);
        expect(state.constructors.SystemCommandManager).toHaveBeenCalledWith(appKernel.activationContext, appKernel.editorFacade);
        expect(state.constructors.KeybindingManager).toHaveBeenCalledWith(appKernel.systemCommandManager, appKernel.toolManager);
    });

    it("loads project metadata successfully once", async () => {
        const { appKernel, state } = await loadKernelModule();
        const metadata = [{ id: "project-a", name: "Project A" }];
        state.projectMetadataRepo.load.mockResolvedValue(Result.Success(metadata));

        await expect(appKernel.load()).resolves.toEqual({
            status: "Success",
            data: appKernel,
            message: undefined,
        });
        await expect(appKernel.load()).resolves.toMatchObject({ status: "Success" });

        expect(state.projectMetadataRepo.load).toHaveBeenCalledTimes(1);
        expect(state.projectMetadataRepo.load).toHaveBeenCalledWith("projects.json");
        expect(state.projectManager.load).toHaveBeenCalledWith(metadata);
    });

    it("loads an empty project list and returns an error when metadata load fails", async () => {
        const { appKernel, state } = await loadKernelModule();
        state.projectMetadataRepo.load.mockResolvedValue(Result.Error("disk failed"));

        await expect(appKernel.load()).resolves.toMatchObject({
            status: "Error",
            message: { key: "Failed to load project repository" },
        });

        expect(state.projectManager.load).toHaveBeenCalledWith([]);
    });

    it("serializes and saves project metadata", async () => {
        const { appKernel, state } = await loadKernelModule();
        const saveResult = Result.Success("saved");
        state.projectMetadataRepo.save.mockResolvedValue(saveResult);

        await expect(appKernel.saveProjectManager()).resolves.toBe(saveResult);

        expect(state.projectManager.serialize).toHaveBeenCalledTimes(1);
        expect(state.projectMetadataRepo.save).toHaveBeenCalledWith("projects.json", [
            { id: "project-a", name: "Project A" },
        ]);
    });
});
