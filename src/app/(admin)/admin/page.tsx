import { getDb } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, BookOpen, BarChart3 } from "lucide-react";

export const metadata = { title: "Admin — Revision Master" };

export default async function AdminPage() {
  const db = await getDb();
  const [userCount, docCount, noteCount, termCount] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("documents").countDocuments(),
    db.collection("notes").countDocuments(),
    db.collection("terms").countDocuments(),
  ]);

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-state-upcoming", bg: "bg-state-upcoming/10" },
    { label: "Total Documents", value: docCount, icon: BookOpen, color: "text-state-today", bg: "bg-state-today/10" },
    { label: "Total Notes", value: noteCount, icon: BarChart3, color: "text-state-stale", bg: "bg-state-stale/10" },
    { label: "Total Terms", value: termCount, icon: BarChart3, color: "text-state-completed", bg: "bg-state-completed/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-state-stale/10">
          <Shield className="h-5 w-5 text-state-stale" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-forest-slate">Admin Panel</h1>
          <p className="text-sm text-mossy-gray">Platform overview and system telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card">
            <CardContent className="p-5">
              <div className={`p-2 rounded-xl ${stat.bg} w-fit mb-3`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="font-mono text-3xl font-bold text-forest-slate tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-mossy-gray mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Database", status: "Connected", ok: true },
            { label: "Authentication", status: "Active", ok: true },
            { label: "Gemini API", status: "Per-user keys (Phase 2)", ok: null },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-forest-slate">{row.label}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                row.ok === true ? "bg-state-today/10 text-state-today" :
                row.ok === false ? "bg-destructive/10 text-destructive" :
                "bg-state-stale/10 text-state-stale"
              }`}>
                {row.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
