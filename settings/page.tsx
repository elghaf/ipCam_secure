'use client';

import { Sidebar } from "@/components/Sidebar";

export default function Settings() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure your app settings
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
              <p className="text-muted-foreground">
                Configure how you want to receive notifications about camera events.
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <h2 className="text-xl font-semibold mb-4">Detection Settings</h2>
              <p className="text-muted-foreground">
                Configure global detection settings for all cameras.
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <h2 className="text-xl font-semibold mb-4">Storage Settings</h2>
              <p className="text-muted-foreground">
                Configure how long to keep recorded videos and snapshots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 