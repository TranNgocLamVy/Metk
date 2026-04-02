import React from "react";

export interface IModal {
    render(): React.ReactNode;
}

export type ModalConstructor = new (props: any) => IModal;

class ModalRegistry {
    private static instance: ModalRegistry;
    private registry: Map<string, ModalConstructor> = new Map();

    public static getInstance(): ModalRegistry {
        if (!ModalRegistry.instance) {
            ModalRegistry.instance = new ModalRegistry();
        }
        return ModalRegistry.instance;
    }

    public register(name: string, constructor: ModalConstructor) {
        this.registry.set(name, constructor);
    }

    public get(name: string): ModalConstructor | undefined {
        return this.registry.get(name);
    }
}

export const modalRegistry = ModalRegistry.getInstance();

export function modal(name: string) {
    return (constructor: ModalConstructor) => {
        modalRegistry.register(name, constructor);
    };
}