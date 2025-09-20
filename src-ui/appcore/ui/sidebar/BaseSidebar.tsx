import { ReactNode } from "react";

import { Result } from "@/appcore/interface/common/result";

export abstract class BaseSidebar {
    abstract id: string;
    abstract name: string;
    abstract icon?: ReactNode;
    abstract description?: string;
    abstract component: React.FC;
    abstract close(): Promise<Result>;
}