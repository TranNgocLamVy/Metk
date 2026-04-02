import { useModalStore } from "@/view/stores/modalStore";
import { modalRegistry } from "./modalRegistry";
import { Fragment } from "react/jsx-runtime";
import { createPortal } from "react-dom";

export function ModalContainer() {
    const { activeModal, props, closeModal } = useModalStore();

    if (!activeModal) return null;

    const ModalClass = modalRegistry.get(activeModal);

    if (!ModalClass) {
        console.warn(`No modal registered for type: ${activeModal}`);
        return null;
    }

    const modalInstance = new ModalClass({ ...props, onClose: closeModal });

    return (
        <Fragment>
            {createPortal(
                <div onClick={closeModal} className="w-full h-full bg-black/10 fixed top-0 left-0 z-50 flex items-center justify-center">
                    {modalInstance.render()}
                </div>
                , document.body
            )}
        </Fragment>
    );
}