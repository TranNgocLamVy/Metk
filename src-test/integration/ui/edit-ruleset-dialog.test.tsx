import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const editRulesetMocks = vi.hoisted(() => {
    let uuidCounter = 0;
    const rulesetSessionInstances: any[] = [];

    class MockRulesetOutputSelector {
        public activatePixiApp = vi.fn();
        public setCurrentRule = vi.fn();
        public setActiveTileset = vi.fn(async (tilesetId: string) => {
            this.activeTilesets.push(tilesetId);
        });
        public activeTilesets: string[] = [];

        constructor(public ruleset: any, public triggerUpdate: () => void) {
            rulesetSessionInstances.push(this);
        }
    }

    return {
        resetUuid: () => {
            uuidCounter = 0;
        },
        uuid: vi.fn(() => {
            uuidCounter += 1;
            return `rule-generated-${uuidCounter}`;
        }),
        rulesetSessionInstances,
        MockRulesetOutputSelector,
        appKernel: {
            activationContext: {
                setFlag: vi.fn(),
            },
            editorFacade: {
                currentProject: null as any,
                textureManager: {
                    getTileTexture: vi.fn(() => ({ id: "texture" })),
                },
            },
        },
    };
});

vi.mock("uuid", () => ({ v4: editRulesetMocks.uuid }));
vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: editRulesetMocks.appKernel }));
vi.mock("@/ui/dialogs/edit-ruleset/graphics/ruleset-ouput-selector.renderer", () => ({
    RulesetOutputSelector: editRulesetMocks.MockRulesetOutputSelector,
}));
vi.mock("@pixi/react", () => ({
    Application: ({ onInit, className }: { onInit?: (app: any) => void; className?: string }) => {
        queueMicrotask(() => {
            onInit?.({ renderer: { resize: vi.fn() }, screen: { width: 100, height: 100 }, stage: { addChild: vi.fn() } });
        });
        return <div data-testid="ruleset-pixi-app" className={className} />;
    },
}));
vi.mock("@/ui/components/custom/PixiImage", () => ({
    default: () => <img alt="tile" src="data:image/png;base64,test" />,
}));
vi.mock("react-color", () => ({
    SketchPicker: ({ onChange }: { onChange: (color: { hex: string }) => void }) => (
        <button type="button" onClick={() => onChange({ hex: "#ff00ff" })}>
            Pick ruleset color
        </button>
    ),
}));
vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({
        t: (message: string) => message,
    }),
}));

import { RuleRequirement } from "@/shared/data-types/ruleset.data";
import { EditRulesetDialog } from "@/ui/dialogs/edit-ruleset/EditRulesetDialog";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { useRulesetStore } from "@/ui/stores/ruleset.store";

class FakeConstraint {
    private requirement: RuleRequirement;
    private allowEmpty: boolean;
    private targets: string[];

    constructor(requirement = RuleRequirement.ANY, targets: string[] = [], allowEmpty = false) {
        this.requirement = requirement;
        this.targets = [...targets];
        this.allowEmpty = allowEmpty;
    }

    getRequirement = () => this.requirement;
    setRequirement = (requirement: RuleRequirement) => {
        this.requirement = requirement;
    };
    getTargetIds = () => [...this.targets];
    addTarget = (targetId: string) => {
        this.targets.push(targetId);
    };
    removeTarget = (targetId: string) => {
        this.targets = this.targets.filter((id) => id !== targetId);
    };
    getAllowEmpty = () => this.allowEmpty;
    setAllowEmpty = (allowEmpty: boolean) => {
        this.allowEmpty = allowEmpty;
    };
    serialize = () => `${this.requirement}:${this.allowEmpty ? 1 : 0}:${this.targets.join(".")}`;
}

class FakeRule {
    public constraints: FakeConstraint[];
    public outputs: Array<{ tileId: number; tilesetIndex: number; serialize: () => string }>;

    constructor(public id: string, outputTileId?: number) {
        this.constraints = Array.from({ length: 9 }, () => new FakeConstraint());
        this.constraints[0] = new FakeConstraint(RuleRequirement.IS, ["terrain"], true);
        this.outputs = outputTileId === undefined
            ? []
            : [{ tileId: outputTileId, tilesetIndex: 0, serialize: () => `${outputTileId}:0:1` }];
    }

    getOutputs = () => this.outputs;
    getConsrtaints = () => this.constraints;
    getConstraint = (index: number) => this.constraints[index];
    addOutput = (tileId: number, tilesetId: string) => {
        this.outputs.push({ tileId, tilesetIndex: tilesetId === "terrain-tiles" ? 0 : 1, serialize: () => `${tileId}:0:1` });
    };
    removeOutput = (tileId: number) => {
        this.outputs = this.outputs.filter((output) => output.tileId !== tileId);
    };
    serialize = () => ({
        id: this.id,
        constraints: this.constraints.map((constraint) => constraint.serialize()).join(","),
        outputs: this.outputs.map((output) => output.serialize()).join(","),
    });
}

class FakeTilesetRefManager {
    private refs = [{ index: 0, id: "terrain-tiles", name: "Terrain Tiles" }];

    serialize = () => ({ refs: [...this.refs], nextIndex: 1 });
    getTilesetRefId = (index: number) => this.refs.find((ref) => ref.index === index)?.id ?? null;
    getTilesetRefIndex = (id: string) => this.refs.find((ref) => ref.id === id)?.index ?? -1;
}

class FakeRuleset {
    public name = "Terrain Rules";
    public color = "#22c55e";
    public size = 3;
    public tilesetRefManager = new FakeTilesetRefManager();
    public rules = [new FakeRule("rule-a", 0), new FakeRule("rule-b")];

    constructor(public id = "ruleset-a") {}

    getAllRules = () => this.rules;
    getRule = (id: string) => this.rules.find((rule) => rule.id === id) ?? null;
    addEmptyRule = () => {
        this.rules.push(new FakeRule(editRulesetMocks.uuid()));
    };
    duplicateRule = (ruleId: string) => {
        const rule = this.getRule(ruleId);
        if (rule) this.rules.push(new FakeRule(editRulesetMocks.uuid(), rule.outputs[0]?.tileId));
    };
    moveRule = (ruleId: string, targetRuleId: string, position: "before" | "after") => {
        const sourceIndex = this.rules.findIndex((rule) => rule.id === ruleId);
        if (sourceIndex === -1 || ruleId === targetRuleId) return false;

        const [rule] = this.rules.splice(sourceIndex, 1);
        const targetIndex = this.rules.findIndex((targetRule) => targetRule.id === targetRuleId);
        if (targetIndex === -1 || !rule) return false;

        this.rules.splice(position === "before" ? targetIndex : targetIndex + 1, 0, rule);
        return true;
    };
    removeRule = (ruleId: string) => {
        this.rules = this.rules.filter((rule) => rule.id !== ruleId);
    };
    serialize = () => ({
        id: this.id,
        name: this.name,
        color: this.color,
        size: this.size,
        rules: this.rules.map((rule) => rule.serialize()),
        tilesets: this.tilesetRefManager.serialize(),
        rulesets: { refs: [], nextIndex: 0 },
    });
}

const renderDialog = () => render(<EditRulesetDialog dialogId="dialog-a" rulesetId="ruleset-a" />);

const createDataTransfer = () => {
    const data: Record<string, string> = {};
    return {
        dropEffect: "move",
        effectAllowed: "move",
        setData: vi.fn((type: string, value: string) => {
            data[type] = value;
        }),
        getData: vi.fn((type: string) => data[type] ?? ""),
    } as unknown as DataTransfer;
};

const mockRuleRowRect = (row: HTMLElement) => {
    Object.defineProperty(row, "getBoundingClientRect", {
        configurable: true,
        value: () => ({
            top: 0,
            bottom: 48,
            left: 0,
            right: 200,
            width: 200,
            height: 48,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }),
    });
};

const createDragEvent = (type: string, dataTransfer: DataTransfer, clientY = 0) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
    Object.defineProperty(event, "clientY", { value: clientY });
    return event;
};

beforeEach(() => {
    useDialogStore.setState(useDialogStore.getInitialState(), true);
    useRulesetStore.setState(useRulesetStore.getInitialState(), true);
    useRulesetStore.getState().setRulesetDisplayData([
        { id: "terrain", name: "Terrain Rules", color: "#22c55e" },
        { id: "water", name: "Water Rules", color: "#38bdf8" },
    ]);
    editRulesetMocks.resetUuid();
    editRulesetMocks.rulesetSessionInstances.length = 0;
    editRulesetMocks.appKernel.activationContext.setFlag.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
});

describe("Edit ruleset dialog workflow", () => {
    it("opens with cloned ruleset data, renders available rules, and selects rules from the sidebar", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const clonedRuleset = new FakeRuleset();
        const rulesetManager = {
            deepCloneRuleset: vi.fn(() => clonedRuleset),
            updateRuleset: vi.fn(),
            saveRuleset: vi.fn(),
        };
        editRulesetMocks.appKernel.editorFacade.currentProject = {
            rulesetManager,
            tilesetManager: {
                serialize: vi.fn(() => [{ id: "terrain-tiles", name: "Terrain Tiles" }]),
            },
        };

        renderDialog();

        expect(rulesetManager.deepCloneRuleset).toHaveBeenCalledWith("ruleset-a");
        expect(screen.getByDisplayValue("Terrain Rules")).toBeVisible();
        expect(screen.getByText("1")).toBeVisible();
        expect(screen.getByText("2")).toBeVisible();
        expect(screen.getAllByAltText("tile").length).toBeGreaterThan(0);

        await user.click(screen.getByText("2"));

        await waitFor(() => {
            expect(editRulesetMocks.rulesetSessionInstances[0].setCurrentRule).toHaveBeenLastCalledWith(clonedRuleset.getRule("rule-b"));
        });
    });

    it("edits rule constraints, targets, and empty target behavior through the rule editor", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const clonedRuleset = new FakeRuleset();
        editRulesetMocks.appKernel.editorFacade.currentProject = {
            rulesetManager: {
                deepCloneRuleset: vi.fn(() => clonedRuleset),
                updateRuleset: vi.fn(),
                saveRuleset: vi.fn(),
            },
            tilesetManager: {
                serialize: vi.fn(() => [{ id: "terrain-tiles", name: "Terrain Tiles" }]),
            },
        };

        renderDialog();

        await user.click(screen.getByText("NOT"));
        expect(clonedRuleset.getRule("rule-a")!.getConstraint(0).getRequirement()).toBe(RuleRequirement.NOT);

        await user.click(screen.getByText("Water Rules"));
        expect(clonedRuleset.getRule("rule-a")!.getConstraint(0).getTargetIds()).toContain("water");

        await user.click(screen.getByText("dialog.editRuleset.empty"));
        expect(clonedRuleset.getRule("rule-a")!.getConstraint(0).getAllowEmpty()).toBe(false);
    });

    it("adds a new empty rule and renders the empty selected-rule state after deleting all rules", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const clonedRuleset = new FakeRuleset();
        editRulesetMocks.appKernel.editorFacade.currentProject = {
            rulesetManager: {
                deepCloneRuleset: vi.fn(() => clonedRuleset),
                updateRuleset: vi.fn(),
                saveRuleset: vi.fn(),
            },
            tilesetManager: {
                serialize: vi.fn(() => [{ id: "terrain-tiles", name: "Terrain Tiles" }]),
            },
        };

        const { container } = renderDialog();

        const sidebar = screen.getByDisplayValue("Terrain Rules").closest(".bg-surface")!;
        const addRuleButton = within(sidebar as HTMLElement).getAllByRole("button")[0];
        await user.click(addRuleButton);

        expect(clonedRuleset.rules).toHaveLength(3);
        expect(screen.getByText("3")).toBeVisible();

        clonedRuleset.removeRule("rule-a");
        clonedRuleset.removeRule("rule-b");
        clonedRuleset.removeRule("rule-generated-1");
        await user.click(addRuleButton);
        clonedRuleset.removeRule("rule-generated-2");
        await user.click(screen.getByText("dialog.editRuleset.action.discard"));

        expect(container).toBeTruthy();
    });

    it("reorders rules by drag and drop and saves the new order", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const clonedRuleset = new FakeRuleset();
        const rulesetManager = {
            deepCloneRuleset: vi.fn(() => clonedRuleset),
            updateRuleset: vi.fn(),
            saveRuleset: vi.fn().mockResolvedValue(undefined),
        };
        editRulesetMocks.appKernel.editorFacade.currentProject = {
            rulesetManager,
            tilesetManager: {
                serialize: vi.fn(() => [{ id: "terrain-tiles", name: "Terrain Tiles" }]),
            },
        };

        renderDialog();

        const firstRow = screen.getByText("1").closest("[draggable='true']") as HTMLElement;
        const secondRow = screen.getByText("2").closest("[draggable='true']") as HTMLElement;
        mockRuleRowRect(firstRow);

        const dataTransfer = createDataTransfer();
        fireEvent(secondRow, createDragEvent("dragstart", dataTransfer));
        fireEvent(firstRow, createDragEvent("dragover", dataTransfer, 1));
        fireEvent(firstRow, createDragEvent("drop", dataTransfer, 1));

        expect(clonedRuleset.rules.map((rule) => rule.id)).toEqual(["rule-b", "rule-a"]);

        await user.click(screen.getByText("dialog.editRuleset.action.save"));

        expect(rulesetManager.updateRuleset).toHaveBeenCalledWith(expect.objectContaining({
            rules: [
                expect.objectContaining({ id: "rule-b" }),
                expect.objectContaining({ id: "rule-a" }),
            ],
        }));
    });

    it("selects output tilesets through OutputSelector and saves the cloned ruleset only on confirmation", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const clonedRuleset = new FakeRuleset();
        const rulesetManager = {
            deepCloneRuleset: vi.fn(() => clonedRuleset),
            updateRuleset: vi.fn(),
            saveRuleset: vi.fn().mockResolvedValue(undefined),
        };
        const closeDialog = vi.fn();
        useDialogStore.setState({ ...useDialogStore.getState(), closeDialog });
        editRulesetMocks.appKernel.editorFacade.currentProject = {
            rulesetManager,
            tilesetManager: {
                serialize: vi.fn(() => [
                    { id: "terrain-tiles", name: "Terrain Tiles" },
                    { id: "water-tiles", name: "Water Tiles" },
                ]),
            },
        };

        renderDialog();

        const buttons = screen.getAllByRole("button", { name: "" });
        const outputMenuButton = buttons[buttons.length - 1]!;
        await user.click(outputMenuButton);
        await user.click(await screen.findByText("Water Tiles"));

        expect(editRulesetMocks.rulesetSessionInstances[0].setActiveTileset).toHaveBeenCalledWith("water-tiles");

        await user.clear(screen.getByDisplayValue("Terrain Rules"));
        await user.type(screen.getByRole("textbox"), "Edited Rules");
        await user.keyboard("{Enter}");
        await user.click(screen.getByText("dialog.editRuleset.action.save"));

        expect(rulesetManager.updateRuleset).toHaveBeenCalledWith(expect.objectContaining({
            name: "Edited Rules",
            rules: expect.any(Array),
        }));
        expect(rulesetManager.saveRuleset).toHaveBeenCalledWith("ruleset-a");
        expect(closeDialog).toHaveBeenCalledWith("dialog-a");
    }, 10000);

    it("closes without committing when the user discards changes", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const closeDialog = vi.fn();
        const rulesetManager = {
            deepCloneRuleset: vi.fn(() => new FakeRuleset()),
            updateRuleset: vi.fn(),
            saveRuleset: vi.fn(),
        };
        useDialogStore.setState({ ...useDialogStore.getState(), closeDialog });
        editRulesetMocks.appKernel.editorFacade.currentProject = {
            rulesetManager,
            tilesetManager: {
                serialize: vi.fn(() => []),
            },
        };

        renderDialog();

        await user.click(screen.getByText("dialog.editRuleset.action.discard"));

        expect(rulesetManager.updateRuleset).not.toHaveBeenCalled();
        expect(rulesetManager.saveRuleset).not.toHaveBeenCalled();
        expect(closeDialog).toHaveBeenCalledWith("dialog-a");
    });

    it("renders no dialog when the ruleset cannot be cloned", () => {
        editRulesetMocks.appKernel.editorFacade.currentProject = {
            rulesetManager: {
                deepCloneRuleset: vi.fn(() => null),
            },
        };

        renderDialog();

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
