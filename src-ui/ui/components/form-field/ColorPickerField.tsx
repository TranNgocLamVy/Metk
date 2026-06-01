import { LocalizedText } from '@/ui/components/custom/LocalizeText';
import { HStack, VStack } from '@/ui/components/custom/stack/Stack';
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";
import { useState } from "react";
import { SketchPicker } from 'react-color';

interface ColorPickerProps {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	value: string;
	defaultValue?: string;
	disabled?: boolean;
	onChange: (fieldName: string, color: string) => void;
}

export function ColorPickerField(props: ColorPickerProps) {
	const { id, name, label, defaultValue, placeholder, value, disabled, onChange } = props;

	const [isOpen, setIsOpen] = useState(false);
	const [color, setColor] = useState(value ?? defaultValue ?? "#ffffff");


	const handleChange = (color: string) => {
		setColor(color);
	}

	const handleSubmit = () => {
		if (disabled) return;
		onChange(name, color);
		setIsOpen(false);
	}

	const handleClose = () => {
		setIsOpen(false);
		setColor(value ?? defaultValue ?? "#ffffff");
	}

	const customStyles = {
		default: {
			picker: { // The main container
				width: '220px',
				padding: '0px',
				boxShadow: '0 0 0 0',
				background: 'var(--background)'
			},
		}
	};

	return (
		<div className="grid grid-cols-[max-content_minmax(0,1fr)] h-full items-center gap-2">
			<Label htmlFor={id} className="text-2xs"><LocalizedText message={label} /></Label>
			<HStack className="gap-2">
				<Input id={id} name={name} type="text" placeholder={placeholder} value={color} disabled={disabled} onChange={(e) => handleChange(e.target.value)} className="flex-1 text-2xs h-6" />
				<DropdownMenu open={isOpen} modal>
					<DropdownMenuTrigger asChild disabled={disabled} onClick={() => setIsOpen(true)}>
						<div className="w-6 h-6" style={{ backgroundColor: color ? color : "#ffffff" }} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="center" side="right" sideOffset={8} className="w-fit h-fit bg-surface-overlay p-4">
						<VStack className="custom-sketch-picker w-fit">
							<style>{`.custom-sketch-picker label { color: var(--foreground) !important; }`}</style>
							<SketchPicker color={color} onChange={(color) => handleChange(color.hex)} styles={customStyles} disableAlpha presetColors={[]} />
							<HStack className="gap-2">
								<Button variant="outline" className="ml-auto" type="reset" size="sm" onClick={() => handleClose()}>Reset</Button>
								<Button type="button" size="sm" onClick={() => handleSubmit()}>Select</Button>
							</HStack>
						</VStack>
					</DropdownMenuContent>
				</DropdownMenu>
			</HStack>
		</div>
	);
}

export const isHexColor = (hex: string): boolean => {
	return /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(hex);
};
