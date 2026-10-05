import { Outlet } from "react-router-dom";
import Sidebar from "./Profile/Sidebar";

export default function MainLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
