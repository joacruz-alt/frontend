"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StringField {
  key: string;
  value: string;
}

function collectStringFields(
  value: unknown,
  fields: StringField[] = [],
  depth = 0,
): StringField[] {
  if (!value || typeof value !== "object" || depth > 5) return fields;

  for (const [key, nestedValue] of Object.entries(value)) {
    if (typeof nestedValue === "string") {
      fields.push({ key: key.toLowerCase().replace(/[^a-z]/g, ""), value: nestedValue });
    } else {
      collectStringFields(nestedValue, fields, depth + 1);
    }
  }

  return fields;
}

function findToken(value: unknown, tokenType: "access" | "refresh"): string | undefined {
  const candidates = collectStringFields(value)
    .map((field) => {
      const isRefresh = field.key.includes("refresh");
      const isToken = field.key.includes("token") || field.key.includes("jwt");

      if (tokenType === "refresh") {
        return {
          ...field,
          priority: isRefresh && isToken ? 0 : 99,
        };
      }

      if (isRefresh) return { ...field, priority: 99 };
      if (field.key.includes("access") && isToken) return { ...field, priority: 0 };
      if (["token", "jwt", "jwttoken", "authtoken", "bearertoken"].includes(field.key)) {
        return { ...field, priority: 1 };
      }
      if (isToken) return { ...field, priority: 2 };
      return { ...field, priority: 99 };
    })
    .filter((field) => field.priority < 99 && field.value.trim())
    .sort((left, right) => left.priority - right.priority);

  return candidates[0]?.value.replace(/^Bearer\s+/i, "").trim();
}

export default function LoginPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isChecking) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiClient<unknown>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const accessToken = findToken(data, "access");
      const refreshToken = findToken(data, "refresh");

      if (!accessToken) {
        throw new Error(
          "The server accepted the login but did not return an access token.",
        );
      }

      setTokens(accessToken, refreshToken);
      router.replace(CONFIG.ROUTES.DASHBOARD);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to log in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#0a3f34_0%,_#023020_35%,_#12070d_100%)] p-4 font-sans text-white">
      <Card className="w-full max-w-md border border-white/10 bg-[#0a2f29]/85 text-white shadow-2xl shadow-emerald-950/35 backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Login</CardTitle>
          <CardDescription className="text-white/70">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-white/15 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-emerald-300/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-white/15 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-emerald-300/40"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-[#d9f7e8] text-[#023020] hover:bg-white"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <p className="text-center text-sm text-white/60">
              Don&apos;t have an account?{" "}
              <Link href={CONFIG.ROUTES.REGISTER} className="font-medium text-[#d9f7e8] underline underline-offset-4">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}