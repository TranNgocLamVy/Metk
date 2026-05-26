import { Checkbox } from "@/ui/components/shadcn/checkbox";
import { Label } from "@/ui/components/shadcn/label";
import { LocalizedText } from "../custom/LocalizeText";

interface CheckBoxProps {
	id: string;
	name: string;
	label: string;
	defaultChecked?: boolean;
    value?: boolean;
	required?: boolean;
	disabled?: boolean;
	handleChange?: (checked: boolean) => void;
}

export function CheckBoxField(props: CheckBoxProps) {
	const { id, name, label, required, disabled, value, handleChange } = props;

    const onChange = (checked: boolean | "indeterminate") => {
        handleChange?.(checked === true);
    }

	return (
		<div className="grid grid-cols-[max-content_minmax(0,1fr)] h-full items-center gap-2">
			<Checkbox id={id} name={name} checked={value} onCheckedChange={onChange} required={required} disabled={disabled} />
			<Label htmlFor={id} className="text-2xs"><LocalizedText message={label} /></Label>
		</div>
	);
}
