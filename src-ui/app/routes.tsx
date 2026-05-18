import HomePage from "@/ui/pages/Home";
import WorkspacePage from "@/ui/pages/Workspace";
import { Route, Routes } from "react-router-dom";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path={"/"} element={<HomePage />} />
            <Route path={"/workspace/:projectId"} element={<WorkspacePage />} />
        </Routes>
    )
}