import { create } from "zustand";

export class TestClass {
    count = 0;
    increment() {
        this.count++;
        return this;
    }
}

type TestStore = {
    version: number;
    test: TestClass;
    increment: () => void;
};

export const useTestStore = create<TestStore>((set) => {
    return {
        version: 0,
        test: new TestClass(),
        increment: () => {
            set((s) => ({ version: s.version + 1, test: s.test.increment() }));
        },
    };
});
