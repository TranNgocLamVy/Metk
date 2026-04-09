import { DialogItem } from '@/shared/types/dialog';
import React from 'react';
import { DialogRegistry } from './dialogRegistry';

type Props = {
    dialog: DialogItem;
    index: number;
}

export default function BaseModalWrapper({ dialog, index }: Props) {
    const { zIndex } = dialog.config || {};

    const computedZIndex = zIndex ?? (1000 + index * 10);

    return (
        <div className="fixed w-full h-full flex items-center justify-center" style={{ zIndex: computedZIndex }}>
            {React.createElement(DialogRegistry[dialog.type], { ...dialog.params, dialogId: dialog.id })}
        </div>
    );
};