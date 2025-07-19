import { FileDropdown } from "@/components/layout/MenuBar/Dropdown/FileDropdown";
import { useTheme } from "@/components/providers/Theme/ThemeProvider";
import { Button } from "@/components/ui/button";

export default function TestPage() {
    const { theme, setTheme } = useTheme();

    const changeTheme = () => {
        if (theme === "light") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-start px-4 py-8">
        </div>
    )
}