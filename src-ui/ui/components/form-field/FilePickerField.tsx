import { FileFilter } from "@/shared/types/form-dialog";
import { FileDialogUtils } from "@/shared/utils/file-dialog.utils";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";
import { useTranslation } from "react-i18next";

type FilePickerProps = {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	defaultDir?: string;
	required?: boolean;
	disabled?: boolean;
	multiple?: boolean;
	filter?: FileFilter;
	value: string[];
	handleChange?: (fieldName: string, raw: unknown) => void;
};

export default function FilePickerField(props: FilePickerProps) {
	const { t: translate } = useTranslation([]);
	const { id, name, label, placeholder, defaultDir, required, disabled, multiple, filter, value, handleChange } = props;

	const selectFile = async () => {
		const path = await FileDialogUtils.open({
			directory: false, // Only allow selecting files
			defaultPath: defaultDir,
			multiple: multiple ?? false, // Prevent multiple selection
			filters: filter ? [
				{
					name: filter.name,
					extensions: filter.extensions,
				},
			] : undefined,
		});
		if (!path) return;
		if (Array.isArray(path)) {
			handleChange?.(name, path);
		} else {
			handleChange?.(name, [path]);
		}
	};

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const paths = e.target.value.split("\n");
			handleChange?.(name, paths);
    }

	const inputValue = value ? (value.length > 0 ? value[0] : "") : "";
	const title = value ? value.join("\n") : "";

	return (
		<div className="grid grid-cols-[max-content_minmax(0,1fr)] h-full items-center gap-2">
			<Label htmlFor={id} className="text-2xs"><LocalizedText message={label} /></Label>
			<HStack className="gap-3">
				<Input
					id={id}
					name={name}
					type="text"
					placeholder={translate(placeholder)}
					value={inputValue}
					onChange={onChange}
					required={required}
					disabled={disabled}
					className="w-full text-2xs h-6"
					title={title}
				/>
				<Button variant="outline" size="xs" className="text-2xs border-foreground/40" onClick={selectFile}>
					<LocalizedText message={"form.tileset.image.browse"} />
				</Button>
			</HStack>
		</div>
	);
}
