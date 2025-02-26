'use client';

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useUserGuardContext } from "@/app/UserGuardContext";

export default function Profile() {
  const router = useRouter();
  const { user } = useUserGuardContext();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast.success("Signed out successfully");
      router.push('/login');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen p-4 bg-muted/50">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-muted-foreground">{user.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Email Verification</label>
              <p className="text-muted-foreground">
                {user.emailVerified ? "Verified" : "Not verified"}
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="destructive"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 