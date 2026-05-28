import { beforeEach, vi } from "vitest";

type ResettableStore<T> = {
    getInitialState: () => T;
    setState: (state: T, replace: true) => void;
};

type ListenerMap = Record<string, Array<(...args: any[]) => void>>;

const kernelMockState = vi.hoisted(() => {
    const createListenerRegistry = () => {
        const listeners: ListenerMap = {};

        return {
            listeners,
            on: vi.fn((eventName: string, listener: (...args: any[]) => void) => {
                listeners[eventName] ??= [];
                listeners[eventName].push(listener);
            }),
            emit: (eventName: string, ...args: any[]) => {
                listeners[eventName]?.forEach((listener) => listener(...args));
            },
        };
    };

    const layoutManager = createListenerRegistry();
    const projectManager = {
        ...createListenerRegistry(),
        currentProject: null as any,
        serialize: vi.fn(() => []),
    };
    const toolManager = createListenerRegistry();
    const workspaceManager = {
        ...createListenerRegistry(),
        currentWorkspace: null as any,
    };

    return {
        appKernel: {
            load: vi.fn(() => new Promise(() => {})),
            activationContext: {
                setFlag: vi.fn(),
            },
            layoutManager,
            projectManager,
            toolManager,
            workspaceManager,
        },
    };
});

const uuidMockState = vi.hoisted(() => {
    let counter = 0;

    return {
        reset: () => {
            counter = 0;
        },
        v4: vi.fn(() => {
            counter += 1;
            return `dialog-id-${counter}`;
        }),
    };
});

const flexLayoutMockState = vi.hoisted(() => ({
    Model: {
        fromJson: vi.fn((layout: unknown) => ({ layout })),
    },
}));

export const kernelMocks = kernelMockState;
export const uuidMocks = uuidMockState;
export const flexLayoutMocks = flexLayoutMockState;

vi.mock("@/application/bootstrap/app-kernel", () => kernelMocks);
vi.mock("uuid", () => ({ v4: uuidMocks.v4 }));
vi.mock("flexlayout-react", () => flexLayoutMocks);
vi.mock("pixi.js", () => ({ Application: vi.fn() }));

beforeEach(() => {
    uuidMocks.reset();
    uuidMocks.v4.mockClear();
    kernelMocks.appKernel.load.mockClear();
    kernelMocks.appKernel.activationContext.setFlag.mockClear();
    kernelMocks.appKernel.projectManager.serialize.mockClear();
});

export const resetStore = <T>(store: ResettableStore<T>) => {
    store.setState(store.getInitialState(), true);
};
