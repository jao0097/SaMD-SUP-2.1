import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useState } from "react";

export function Layout() {
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar
          onNotificationsClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
          notificationsPanelOpen={notificationsPanelOpen}
        />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
