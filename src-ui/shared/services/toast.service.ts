import { ReactNode } from "react";
import { ExternalToast, toast } from "sonner";

export type ToastOptions = {
    message: string | ReactNode;
    options?: ExternalToast;
}

export class ToastService {
    public static success(options: ToastOptions) {
        toast.success(options.message, options.options);
    }

    public static error(options: ToastOptions) {
        toast.error(options.message, options.options);
    }

    public static info(options: ToastOptions) {
        toast.info(options.message, options.options);
    }

    public static warning(options: ToastOptions) {
        toast.warning(options.message, options.options);
    }

    public static message(options: ToastOptions) {
        toast.message(options.message, options.options);
    }
}