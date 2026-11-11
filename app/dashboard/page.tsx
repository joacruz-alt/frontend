"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#0a3f34_0%,_#023020_35%,_#12070d_100%)] text-white/80">
        <p className="text-sm">Verifying session...</p>
      </div>
    );
  }

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0a3f34_0%,_#023020_35%,_#12070d_100%)] p-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back</h1>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="bg-[#d9f7e8] text-[#023020] hover:bg-white"
          >
            Logout
          </Button>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border border-white/10 bg-white/5 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-white">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$84.2k</p>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/5 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-white">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">24</p>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/5 text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-white">Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">+28%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}