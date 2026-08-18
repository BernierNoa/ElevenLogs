import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { GlobalSearch } from "../components/GlobalSearch";
import { NotificationBell } from "../components/NotificationBell";
import { Footer } from "../components/Footer";
import { ToastHost } from "../components/ui/Toast";
import { OfflineSyncManager } from "../components/OfflineSyncManager";
import { PendingLogsIndicator } from "../components/PendingLogsIndicator";
import { ProfileSync } from "../components/ProfileSync";
import { PendingInviteFollow } from "../components/PendingInviteFollow";
import { BadgeUnlockWatcher } from "../components/BadgeUnlockWatcher";
import { PatchNoteModal } from "../components/PatchNoteModal";
import { AddToHomeScreenPrompt } from "../components/AddToHomeScreenPrompt";

export function AppLayout() {
  return (
    <div className="min-h-screen flex bg-noir text-craie">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-24 md:pb-0 flex flex-col">
        <div className="sticky top-0 z-30 bg-noir/95 backdrop-blur border-b border-ligne px-5 md:px-8 py-3 flex items-center justify-between gap-3">
          <GlobalSearch />
          <NotificationBell />
        </div>
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
      <div className="fixed bottom-4 inset-x-4 md:hidden">
        <TabBar />
      </div>
      <ToastHost />
      <PendingLogsIndicator />
      <OfflineSyncManager />
      <ProfileSync />
      <PendingInviteFollow />
      <BadgeUnlockWatcher />
      <PatchNoteModal />
      <AddToHomeScreenPrompt />
    </div>
  );
}
