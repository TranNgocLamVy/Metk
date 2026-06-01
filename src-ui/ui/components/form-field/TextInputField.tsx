import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";
import { useTranslation } from "react-i18next";

interface TextInputProps {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	minLength?: number;
	maxLength?: number;
	value?: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
}

export function TextInputField(props: TextInputProps) {
	const { t: translate } = useTranslation([]);
	const { id, name, label, placeholder, required, disabled, minLength, maxLength, value, handleChange } = props;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleChange?.(name, e.target.value);
    }

	return (
		<div className="grid grid-cols-[max-content_minmax(0,1fr)] h-full items-center gap-2">
			<Label htmlFor={id} className="text-2xs"><LocalizedText message={label} /></Label>
			<Input id={id} name={name} type="text" placeholder={translate(placeholder)} required={required} disabled={disabled} minLength={minLength} maxLength={maxLength} value={value ?? ""} onChange={onChange} className="w-full text-2xs h-6" />
		</div>
	);
}
