import { useModalStore } from "@/view/stores/modalStore";
import { Fragment } from "react/jsx-runtime";
import { createPortal } from "react-dom";
import { Button } from "../../shadcn/button";
import { OpenFileModal } from "../../modal/OpenFileModel";

export function ModalContainer() {
    const { activeModal, options, closeModal } = useModalStore();

    if (!activeModal) return null;

    return (
        <Fragment>
            {createPortal(
                <div onClick={closeModal} className="w-full h-full bg-black/10 fixed top-0 left-0 z-50 flex items-center justify-center">
                    <ModalContent />
                </div>
                , document.getElementById("main-container")!
            )}
        </Fragment>
    );
}

function ModalContent() {
    const { activeModal, props } = useModalStore();

    switch (activeModal) {
        case "OPEN_FILE":
            return <OpenFileModal {...props} />
        default:
            return <DefaultModalContent />
    }
}

function DefaultModalContent() {
    const { closeModal } = useModalStore();

    return (
        <div className="w-90 h-90 bg-secondary-background shadow-md border flex items-center justify-center">
            <Button onClick={closeModal}>Close</Button>
        </div>
    )
}