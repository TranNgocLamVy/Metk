import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ThemeProvider, { useTheme } from "@/app/providers/theme.provider";

function ThemeConsumer() {
    const { theme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme-value">{theme}</span>
            <button type="button" onClick={() => setTheme("dark")}>Dark</button>
            <button type="button" onClick={() => setTheme("light")}>Light</button>
            <button type="button" onClick={() => setTheme("system")}>System</button>
        </div>
    );
}

const mockSystemTheme = (matches: boolean) => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
};

describe("ThemeProvider", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.className = "";
        vi.mocked(window.matchMedia).mockReset();
        mockSystemTheme(false);
    });

    it("initializes with the default theme and applies its class", () => {
        render(
            <ThemeProvider defaultTheme="dark" storageKey="theme-test">
                <ThemeConsumer />
            </ThemeProvider>,
        );

        expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
        expect(document.documentElement).toHaveClass("dark");
        expect(document.documentElement).not.toHaveClass("light");
    });

    it("restores the theme from localStorage over the default theme", () => {
        localStorage.setItem("theme-test", "light");

        render(
            <ThemeProvider defaultTheme="dark" storageKey="theme-test">
                <ThemeConsumer />
            </ThemeProvider>,
        );

        expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
        expect(document.documentElement).toHaveClass("light");
    });

    it("resolves system theme through matchMedia", () => {
        mockSystemTheme(true);

        render(
            <ThemeProvider defaultTheme="system" storageKey="theme-test">
                <ThemeConsumer />
            </ThemeProvider>,
        );

        expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
        expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
        expect(document.documentElement).toHaveClass("dark");
    });

    it("updates provider state, localStorage, and document classes from a consumer", async () => {
        const user = userEvent.setup();
        localStorage.setItem("theme-test", "dark");

        render(
            <ThemeProvider defaultTheme="system" storageKey="theme-test">
                <ThemeConsumer />
            </ThemeProvider>,
        );

        expect(document.documentElement).toHaveClass("dark");

        await user.click(screen.getByRole("button", { name: "Light" }));

        expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
        expect(localStorage.getItem("theme-test")).toBe("light");
        expect(document.documentElement).toHaveClass("light");
        expect(document.documentElement).not.toHaveClass("dark");

        await user.click(screen.getByRole("button", { name: "System" }));

        expect(localStorage.getItem("theme-test")).toBe("system");
        expect(document.documentElement).toHaveClass("light");
    });
});
