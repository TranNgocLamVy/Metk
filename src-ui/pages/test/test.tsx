import { VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";

import { useTestStore } from "./store";

export default function TestPage() {
    const test = useTestStore((s) => s.test);
    useTestStore((s) => s.version);
	const inc = useTestStore((s) => s.increment);

	return (
		<VStack>
			<Button onClick={inc}>Test {test.count}</Button>
		</VStack>
	);
}