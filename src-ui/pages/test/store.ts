import { create } from "zustand";

export class TestClass {
    count = 0;

    constructor(private publish: (next: TestClass) => void) { }

    increment() {
        this.count++;
        // publish a NEW instance or a cloned reference so Zustand sees a change
        const next = new TestClass(this.publish);
        next.count = this.count;
        this.publish(next);
    }
}

type TestStore = {
    test: TestClass;
};

export const useTestStore = create<TestStore>((set) => {
    // helper that updates `test` with a NEW reference:
    const publish = (next: TestClass) => set({ test: next });

    return {
        test: new TestClass(publish),
    };
});
