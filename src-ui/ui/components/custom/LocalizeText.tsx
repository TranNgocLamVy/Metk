import { useTranslation } from "react-i18next";

export type TranslatableMessage = { key: string; options?: Record<string, any> };

export const LocalizedText = ({ message }: { message: string | TranslatableMessage }) => {
    const { t: translate } = useTranslation();
    if (typeof message === "string") return <>{translate(message)}</>;
    return <>{translate(message.key, message.options)}</>;
};