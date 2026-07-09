import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const uiMocks = vi.hoisted(() => {
    const listeners: Record<string, Array<(...args: any[]) => void>> = {};
    const i18n = {
        on: vi.fn((eventName: string, listener: (...args: any[]) => void) => {
            listeners[eventName] ??= [];
            listeners[eventName].push(listener);
        }),
        off: vi.fn((eventName: string, listener: (...args: any[]) => void) => {
            listeners[eventName] = (listeners[eventName] ?? []).filter((registered) => registered !== listener);
        }),
        emit: (eventName: string) => {
            listeners[eventName]?.forEach((listener) => listener());
        },
        clear: () => {
            for (const key of Object.keys(listeners)) delete listeners[key];
        },
    };

    return {
        i18n,
        layerService: {
            createNewTileLayer: vi.fn(),
            duplicateLayer: vi.fn(),
            deselectAllLayers: vi.fn(),
            deleteLayer: vi.fn(),
            toggleSelectedLayersVisibility: vi.fn(),
            toggleSelectedLayersLock: vi.fn(),
            selectAllLayers: vi.fn(),
            moveLayersUp: vi.fn(),
            moveLayersDown: vi.fn(),
        },
    };
});

vi.mock("@/app/providers/i18n", () => ({ default: uiMocks.i18n }));
vi.mock("@/application/actions/tilemap-layer.actions", () => uiMocks.layerService);
vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({
        t: (message: string) => ({
            "errorBoundary.title": "Something went wrong:",
        }[message] ?? message),
    }),
}));

import ContextMenuWrapper from "@/ui/components/context-menu/ContextMenuWrapper";
import MainContainer from "@/ui/components/layout/MainContainer";
import SecurityShield from "@/ui/components/layout/SecurityShield";
import { FallbackRender } from "@/ui/components/layout/FallbackRender";
import { LanguageLoadingOverlay } from "@/ui/components/layout/LanguageLoadingOverlay";
import { LayerManagerContextMenu } from "@/ui/workspace/layer-manager/ContextMenu";
import { getNavigationStoreState, resetNavigationStoreForTest, setNavigationStoreStateForTest } from "@/ui/stores/navigation.store";
import { getTilemapSessionStoreState, resetTilemapSessionStoreForTest, setTilemapSessionStoreStateForTest } from "@/ui/stores/tilemap-session.store";

const resetStores = () => {
    resetNavigationStoreForTest();
    resetTilemapSessionStoreForTest();
};

const openContextMenu = async (target: HTMLElement) => {
    fireEvent.contextMenu(target);
    await screen.findByRole("menu");
};

beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    uiMocks.i18n.clear();
    vi.stubEnv("NODE_ENV", "development");
});

describe("Metk layout UI", () => {
    it("renders the main region, installs navigation, and accounts for the menu bar height", () => {
        const menuBar = document.createElement("div");
        menuBar.id = "menu-bar";
        Object.defineProperty(menuBar, "clientHeight", { value: 38 });
        document.body.appendChild(menuBar);

        render(
            <MemoryRouter>
                <MainContainer data-testid="main-shell">
                    <section>Workspace content</section>
                </MainContainer>
            </MemoryRouter>,
        );

        const main = screen.getByTestId("main-shell");
        expect(main).toHaveAttribute("id", "main-container");
        expect(main).toHaveTextContent("Workspace content");
        expect(main).toHaveStyle({ paddingTop: "38px" });
        expect(getNavigationStoreState().navigate).toEqual(expect.any(Function));

        menuBar.remove();
    });

    it("SecurityShield blocks context menus and disabled browser shortcuts", async () => {
        render(<SecurityShield />);

        const contextMenuEvent = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        window.dispatchEvent(contextMenuEvent);
        expect(contextMenuEvent.defaultPrevented).toBe(true);

        const findEvent = new KeyboardEvent("keydown", { key: "f", ctrlKey: true, bubbles: true, cancelable: true });
        window.dispatchEvent(findEvent);
        expect(findEvent.defaultPrevented).toBe(true);
    });

    it("shows and hides the language loading overlay from i18n transition events", async () => {
        render(<LanguageLoadingOverlay />);

        expect(screen.queryByRole("status")).not.toBeInTheDocument();

        act(() => {
            uiMocks.i18n.emit("languageChanging");
        });
        expect(document.querySelector(".fixed.inset-0")).toBeInTheDocument();

        act(() => {
            uiMocks.i18n.emit("languageChanged");
        });
        await waitFor(() => {
            expect(document.querySelector(".fixed.inset-0")).not.toBeInTheDocument();
        });
    });

    it("renders meaningful fallback error information", () => {
        render(<FallbackRender error={new Error("Renderer crashed")} resetErrorBoundary={vi.fn()} />);

        expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong:");
        expect(screen.getByText("Renderer crashed")).toBeVisible();
    });
});

describe("Metk context menus", () => {
    it("triggers enabled actions, blocks disabled actions, and keeps grouped items separated", async () => {
        const user = userEvent.setup();
        const enabledAction = vi.fn();
        const disabledAction = vi.fn();
        const checkedToggle = vi.fn();
        const menu: MenuItemType = {
            label: "Test menu",
            groups: [
                [
                    { type: "option", label: "Enabled action", onClick: enabledAction },
                    { type: "option", label: "Disabled action", disabled: () => true, onClick: disabledAction },
                ],
                [
                    { type: "check", label: "Grid", checked: () => true, toggle: checkedToggle },
                ],
            ],
        };

        render(
            <ContextMenuWrapper item={menu}>
                <button type="button">Canvas</button>
            </ContextMenuWrapper>,
        );

        await openContextMenu(screen.getByRole("button", { name: "Canvas" }));

        expect(screen.getAllByRole("separator")).toHaveLength(1);
        await user.click(screen.getByText("Enabled action"));
        expect(enabledAction).toHaveBeenCalledTimes(1);

        await openContextMenu(screen.getByRole("button", { name: "Canvas" }));
        const disabledItem = screen.getByText("Disabled action").closest("[role='menuitem']")!;
        await user.click(disabledItem);
        expect(disabledAction).not.toHaveBeenCalled();

        await user.click(screen.getByText("Grid"));
        expect(checkedToggle).toHaveBeenCalledTimes(1);
    });

    it("renders grouped menu items directly and hides invisible items", () => {
        const visibleAction = vi.fn();
        render(
            <ContextMenuWrapper
                item={{
                    label: "Visibility",
                    groups: [
                        [
                            { type: "option", label: "Visible", onClick: visibleAction },
                            { type: "option", label: "Hidden", visible: () => false, onClick: vi.fn() },
                        ],
                    ],
                }}
            >
                <button type="button">Visibility target</button>
            </ContextMenuWrapper>,
        );

        fireEvent.contextMenu(screen.getByRole("button", { name: "Visibility target" }));
        expect(screen.getByText("Visible")).toBeVisible();
        expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    });

    it("invokes a realistic layer-manager context menu workflow against workspace selection state", async () => {
        const user = userEvent.setup();
        getTilemapSessionStoreState().actions.setActiveSession({
            id: "tilemap-session",
            layerState: { selectedLayers: ["ground"] },
        } as any);

        render(
            <ContextMenuWrapper item={LayerManagerContextMenu}>
                <button type="button">Layer manager</button>
            </ContextMenuWrapper>,
        );

        await openContextMenu(screen.getByRole("button", { name: "Layer manager" }));
        await user.click(screen.getByText("workspace.layerManager.contextMenu.duplicate"));

        expect(uiMocks.layerService.duplicateLayer).toHaveBeenCalledTimes(1);

        await openContextMenu(screen.getByRole("button", { name: "Layer manager" }));
        await user.click(screen.getByText("workspace.layerManager.contextMenu.showHide"));

        expect(uiMocks.layerService.toggleSelectedLayersVisibility).toHaveBeenCalledTimes(1);
    });
});
