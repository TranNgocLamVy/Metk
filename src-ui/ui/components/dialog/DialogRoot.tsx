import { useDialogStore } from '@/ui/stores/dialog.store';
import { Fragment } from 'react';
import { DialogRegistry } from './dialogRegistry';
import BaseModalWrapper from './BaseModalWrapper';
import { createPortal } from 'react-dom';

export default function DialogRoot() {
    const dialogs = useDialogStore((state) => state.dialogs);

    if (dialogs.length === 0) return null;

    return (
        <Fragment>
            {createPortal(
                <Fragment>
                    {dialogs.map((dialog, index) => {
                        if (!DialogRegistry[dialog.type]) {
                            console.warn(`Dialog type ${dialog.type} not found in registry`);
                            return null;
                        }
                        return <BaseModalWrapper key={dialog.id} dialog={dialog} index={index} />
                    })}
                </Fragment>
                , document.getElementById("main-container")!
            )}
        </Fragment>
    );
};