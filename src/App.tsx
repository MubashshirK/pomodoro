import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/app-shell";
import { InstallPrompt } from "@/components/pwa-install-prompt";
import { TimerProvider } from "@/components/timer/timer-provider";
import TimerPage from "@/pages/timer-page";
import TasksPage from "@/pages/tasks-page";
import StatsPage from "@/pages/stats-page";
import SettingsPage from "@/pages/settings-page";

export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <TimerProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<TimerPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TimerProvider>
      <InstallPrompt />
    </>
  );
}
