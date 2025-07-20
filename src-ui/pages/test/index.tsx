import { Button } from "@/components/ui/button"
import { useTestStore } from "@/zustand/test"

export default function TestPage() {
    const { count, increment } = useTestStore()

    return (
        <div className="w-full h-full flex flex-col items-center justify-start px-4 py-8">
            <Button onClick={increment}>
                Count: {count}
            </Button>
        </div>
    )
}