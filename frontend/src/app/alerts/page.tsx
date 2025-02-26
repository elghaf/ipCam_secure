import { Sidebar } from "@/components/Sidebar";

export default function Alerts() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Alerts</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your camera alerts
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No alerts yet. Configure detection zones in your cameras to start receiving alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
