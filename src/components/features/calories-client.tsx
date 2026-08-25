"use client";

import * as React from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Dumbbell,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { CalorieTrendChartDynamic as CalorieTrendChart } from "@/components/features/calorie-trend-chart-dynamic";
import {
  addExerciseEntryAction,
  addFoodEntryAction,
  deleteCalorieEntryAction,
  getCaloriesOverviewAction,
  getDayEntriesAction,
  setCalorieGoalAction,
  updateExerciseEntryAction,
  updateFoodEntryAction,
} from "@/actions/calories";
import type {
  CalorieDaySummary,
  CalorieEntry,
  CalorieLibraryItem,
  CalorieMonthSummary,
  CalorieWeekSummary,
  FoodUnit,
} from "@/types";

// ─── Date helpers (all local-timezone, string dayKeys) ─────────────────────────

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDay(dayKey: string, days: number): string {
  const d = new Date(`${dayKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDayKey(d);
}

function mondayOf(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00`);
  return shiftDay(dayKey, -((d.getDay() + 6) % 7));
}

function formatDayLabel(dayKey: string): string {
  return new Date(`${dayKey}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatShort(dayKey: string): string {
  return new Date(`${dayKey}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMonth(monthKey: string): string {
  return new Date(`${monthKey}-15T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const fmtMacro = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: 1 });

function macroPerUnitFromEntry(entry: CalorieEntry, macro: "protein" | "carbs"): string {
  const stored = macro === "protein" ? entry.proteinPerUnit : entry.carbsPerUnit;
  if (stored != null) return String(stored);
  const total = macro === "protein" ? entry.proteinGrams : entry.carbsGrams;
  if (total == null || entry.quantity == null || entry.quantity <= 0) return "";
  const perUnit = entry.unit === "perPiece" ? total / entry.quantity : (total / entry.quantity) * 100;
  return String(Math.round(perUnit * 10) / 10);
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// ─── Small building blocks ─────────────────────────────────────────────────────

function SuggestionList({
  items,
  activeIdx,
  onPick,
}: {
  items: { key: string; label: string; sub: string }[];
  activeIdx: number;
  onPick: (idx: number) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-surface py-1 shadow-hover">
      {items.map((item, idx) => (
        <button
          key={item.key}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(idx);
          }}
          className={cn(
            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
            idx === activeIdx ? "bg-canvas text-forest-slate" : "text-forest-slate hover:bg-canvas"
          )}
        >
          <span className="truncate font-medium">{item.label}</span>
          <span className="shrink-0 text-[11px] text-mossy-gray">{item.sub}</span>
        </button>
      ))}
    </div>
  );
}

function IconStat({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-xl font-bold leading-none text-forest-slate tabular-nums">
          {value}
        </div>
        <div className="mt-1 truncate text-[11px] text-mossy-gray">
          {label}
          {sub ? <span className="ml-1 text-mossy-gray/70">· {sub}</span> : null}
        </div>
      </div>
    </Card>
  );
}

function DayDetailsModal({
  open,
  dayKey,
  entries,
  loading,
  goal,
  todayKey,
  onOpenChange,
  onLogDay,
  onEditEntry,
  onDeleteEntry,
}: {
  open: boolean;
  dayKey: string;
  entries: CalorieEntry[];
  loading: boolean;
  goal: number | null;
  todayKey: string;
  onOpenChange: (open: boolean) => void;
  onLogDay: () => void;
  onEditEntry: (entry: CalorieEntry) => void;
  onDeleteEntry: (entry: CalorieEntry) => void;
}) {
  const foods = entries.filter((entry) => entry.kind === "food");
  const exercises = entries.filter((entry) => entry.kind === "exercise");
  const eaten = foods.reduce((sum, entry) => sum + entry.totalCalories, 0);
  const burned = exercises.reduce((sum, entry) => sum + entry.totalCalories, 0);
  const protein = foods.reduce((sum, entry) => sum + (entry.proteinGrams ?? 0), 0);
  const carbs = foods.reduce((sum, entry) => sum + (entry.carbsGrams ?? 0), 0);
  const net = eaten - burned;
  const delta = goal != null && entries.length > 0 ? goal - net : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dayKey === todayKey ? "Today" : formatDayLabel(dayKey)}</DialogTitle>
          <DialogDescription>
            {entries.length > 0
              ? `${entries.length} item${entries.length === 1 ? "" : "s"} logged`
              : "No food or exercise logged for this day"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="rounded-xl border border-border bg-canvas p-3">
                <div className="text-[11px] text-mossy-gray">Eaten</div>
                <div className="font-mono text-lg font-semibold text-forest-slate">{fmt(eaten)}</div>
              </div>
              <div className="rounded-xl border border-border bg-canvas p-3">
                <div className="text-[11px] text-mossy-gray">Burned</div>
                <div className="font-mono text-lg font-semibold text-forest-slate">{fmt(burned)}</div>
              </div>
              <div className="rounded-xl border border-border bg-canvas p-3">
                <div className="text-[11px] text-mossy-gray">Net</div>
                <div className="font-mono text-lg font-semibold text-forest-slate">{fmt(net)}</div>
              </div>
              <div className="rounded-xl border border-border bg-canvas p-3">
                <div className="text-[11px] text-mossy-gray">Protein</div>
                <div className="font-mono text-lg font-semibold text-forest-slate">{fmtMacro(protein)}g</div>
              </div>
              <div className="rounded-xl border border-border bg-canvas p-3">
                <div className="text-[11px] text-mossy-gray">Carbs</div>
                <div className="font-mono text-lg font-semibold text-forest-slate">{fmtMacro(carbs)}g</div>
              </div>
            </div>

            {delta != null && (
              <div className={cn("rounded-xl px-3 py-2 text-xs font-medium", delta >= 0 ? "bg-state-today/10 text-state-today" : "bg-destructive/10 text-destructive")}>
                {delta >= 0 ? `${fmt(delta)} kcal under goal` : `${fmt(Math.abs(delta))} kcal over goal`}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mossy-gray">Food</h3>
                <div className="space-y-2">
                  {foods.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-mossy-gray">
                      No food logged.
                    </div>
                  ) : (
                    foods.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border bg-canvas px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-forest-slate">{entry.name}</div>
                            <div className="mt-0.5 text-[11px] text-mossy-gray">
                              {entry.unit === "perPiece"
                                ? `Ate ${entry.quantity} pc · product ${fmt(entry.caloriesPerUnit ?? 0)} kcal/pc`
                                : `Ate ${entry.quantity} g · product ${fmt(entry.caloriesPerUnit ?? 0)} kcal/100 g`}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-start gap-1">
                            <div className="px-1 text-right font-mono text-sm font-semibold text-forest-slate">
                              {fmt(entry.totalCalories)}
                            </div>
                            <button
                              type="button"
                              onClick={() => onEditEntry(entry)}
                              className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-surface hover:text-forest-slate"
                              aria-label={`Edit ${entry.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEntry(entry)}
                              className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${entry.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded-full bg-surface px-2 py-0.5 text-mossy-gray">
                            Protein {fmtMacro(entry.proteinGrams ?? 0)}g
                          </span>
                          <span className="rounded-full bg-surface px-2 py-0.5 text-mossy-gray">
                            Carbs {fmtMacro(entry.carbsGrams ?? 0)}g
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mossy-gray">Exercise</h3>
                <div className="space-y-2">
                  {exercises.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-mossy-gray">
                      No exercise logged.
                    </div>
                  ) : (
                    exercises.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-canvas px-3 py-2.5">
                        <div className="min-w-0 truncate text-sm font-medium text-forest-slate">{entry.name}</div>
                        <div className="flex shrink-0 items-center gap-1">
                          <div className="px-1 font-mono text-sm font-semibold text-state-today">
                            -{fmt(entry.totalCalories)}
                          </div>
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-surface hover:text-forest-slate"
                            aria-label={`Edit ${entry.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry)}
                            className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${entry.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={onLogDay}>
                Open day
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type ReportTab = "daily" | "weekly" | "monthly";

interface FoodForm {
  name: string;
  unit: FoodUnit;
  quantity: string;
  caloriesPerUnit: string;
  proteinPerUnit: string;
  carbsPerUnit: string;
  editingId: string | null;
}

interface ExerciseForm {
  name: string;
  caloriesBurned: string;
  editingId: string | null;
}

const EMPTY_FOOD_FORM: FoodForm = {
  name: "",
  unit: "per100g",
  quantity: "",
  caloriesPerUnit: "",
  proteinPerUnit: "",
  carbsPerUnit: "",
  editingId: null,
};
const EMPTY_EXERCISE_FORM: ExerciseForm = { name: "", caloriesBurned: "", editingId: null };

export function CaloriesClient() {
  const [todayKey] = React.useState(() => toDayKey(new Date()));
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const [goal, setGoal] = React.useState<number | null>(null);
  const [goalDraft, setGoalDraft] = React.useState("");
  const [editingGoal, setEditingGoal] = React.useState(false);
  const [goalSaving, setGoalSaving] = React.useState(false);

  const [selectedDay, setSelectedDay] = React.useState(() => toDayKey(new Date()));
  const [entries, setEntries] = React.useState<CalorieEntry[]>([]);
  const [dayLoading, setDayLoading] = React.useState(false);
  const dayReq = React.useRef(0);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsDay, setDetailsDay] = React.useState(todayKey);
  const [detailsEntries, setDetailsEntries] = React.useState<CalorieEntry[]>([]);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const detailsReq = React.useRef(0);

  const [library, setLibrary] = React.useState<CalorieLibraryItem[]>([]);
  const [daily, setDaily] = React.useState<CalorieDaySummary[]>([]);
  const [weekly, setWeekly] = React.useState<CalorieWeekSummary[]>([]);
  const [monthly, setMonthly] = React.useState<CalorieMonthSummary[]>([]);
  const [reportTab, setReportTab] = React.useState<ReportTab>("daily");

  const [foodForm, setFoodForm] = React.useState<FoodForm>(EMPTY_FOOD_FORM);
  const [foodSubmitting, setFoodSubmitting] = React.useState(false);
  const [foodSugOpen, setFoodSugOpen] = React.useState(false);
  const [foodSugIdx, setFoodSugIdx] = React.useState(0);

  const [exForm, setExForm] = React.useState<ExerciseForm>(EMPTY_EXERCISE_FORM);
  const [exSubmitting, setExSubmitting] = React.useState(false);
  const [exSugOpen, setExSugOpen] = React.useState(false);
  const [exSugIdx, setExSugIdx] = React.useState(0);

  const quantityRef = React.useRef<HTMLInputElement>(null);
  const exCaloriesRef = React.useRef<HTMLInputElement>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadOverview = React.useCallback(
    async (silent: boolean) => {
      const res = await getCaloriesOverviewAction(todayKey);
      if (res.success && res.data) {
        setGoal(res.data.dailyCalorieGoal);
        setLibrary(res.data.library);
        setDaily(res.data.daily);
        setWeekly(res.data.weekly);
        setMonthly(res.data.monthly);
        return res.data;
      }
      if (!silent) setLoadError(true);
      return null;
    },
    [todayKey]
  );

  React.useEffect(() => {
    (async () => {
      const data = await loadOverview(false);
      if (data) setEntries(data.dayEntries);
      setLoading(false);
    })();
  }, [loadOverview]);

  async function selectDay(dayKey: string) {
    if (dayKey === selectedDay) return;
    cancelFoodEdit();
    cancelExerciseEdit();
    setSelectedDay(dayKey);
    setDayLoading(true);
    const req = ++dayReq.current;
    const res = await getDayEntriesAction(dayKey);
    if (req !== dayReq.current) return; // stale response, a newer day was selected
    if (res.success && res.data) {
      setEntries(res.data.entries);
    } else {
      toast(res.error ?? "Could not load that day.", { variant: "error" });
    }
    setDayLoading(false);
  }

  /** Re-pull summaries/library after a mutation, without touching the visible log. */
  function refreshSummaries() {
    void loadOverview(true);
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const foodEntries = entries.filter((e) => e.kind === "food");
  const exerciseEntries = entries.filter((e) => e.kind === "exercise");
  const eaten = foodEntries.reduce((s, e) => s + e.totalCalories, 0);
  const protein = foodEntries.reduce((s, e) => s + (e.proteinGrams ?? 0), 0);
  const carbs = foodEntries.reduce((s, e) => s + (e.carbsGrams ?? 0), 0);
  const burned = exerciseEntries.reduce((s, e) => s + e.totalCalories, 0);
  const net = eaten - burned;
  const remaining = goal != null ? goal - net : null;

  const foodLibrary = library.filter((i) => i.kind === "food");
  const exerciseLibrary = library.filter((i) => i.kind === "exercise");

  const foodSuggestions = React.useMemo(() => {
    const q = normalizeName(foodForm.name);
    if (!q) return [];
    return foodLibrary
      .filter((i) => i.nameKey.includes(q) && i.nameKey !== q)
      .slice(0, 6)
      .map((i) => ({
        key: i.id,
        label: i.name,
        sub: `${fmt(i.caloriesPerUnit ?? 0)} kcal/${i.unit === "perPiece" ? "pc" : "100 g"} · P ${fmtMacro(i.proteinPerUnit ?? 0)}g · C ${fmtMacro(i.carbsPerUnit ?? 0)}g`,
        item: i,
      }));
  }, [foodForm.name, foodLibrary]);

  const exerciseSuggestions = React.useMemo(() => {
    const q = normalizeName(exForm.name);
    if (!q) return [];
    return exerciseLibrary
      .filter((i) => i.nameKey.includes(q) && i.nameKey !== q)
      .slice(0, 6)
      .map((i) => ({
        key: i.id,
        label: i.name,
        sub: `${fmt(i.lastCaloriesBurned ?? 0)} kcal · ${i.timesLogged}×`,
        item: i,
      }));
  }, [exForm.name, exerciseLibrary]);

  const quickAdds = React.useMemo(
    () => foodLibrary.slice(0, 6),
    [foodLibrary]
  );

  const previewTotal = React.useMemo(() => {
    const q = parseFloat(foodForm.quantity);
    const c = parseFloat(foodForm.caloriesPerUnit);
    if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c < 0) return null;
    return Math.round(foodForm.unit === "per100g" ? (q / 100) * c : q * c);
  }, [foodForm.quantity, foodForm.caloriesPerUnit, foodForm.unit]);

  const previewProtein = React.useMemo(() => {
    const q = parseFloat(foodForm.quantity);
    const p = parseFloat(foodForm.proteinPerUnit);
    if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p < 0) return null;
    return foodForm.unit === "per100g" ? (q / 100) * p : q * p;
  }, [foodForm.proteinPerUnit, foodForm.quantity, foodForm.unit]);

  const previewCarbs = React.useMemo(() => {
    const q = parseFloat(foodForm.quantity);
    const c = parseFloat(foodForm.carbsPerUnit);
    if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c < 0) return null;
    return foodForm.unit === "per100g" ? (q / 100) * c : q * c;
  }, [foodForm.carbsPerUnit, foodForm.quantity, foodForm.unit]);

  // Insights over the last 30 days.
  const insights = React.useMemo(() => {
    const logged = daily.filter((d) => d.entryCount > 0);
    const last7 = daily.slice(-7).filter((d) => d.entryCount > 0);
    const avg7 = last7.length
      ? Math.round(last7.reduce((s, d) => s + d.netCalories, 0) / last7.length)
      : null;

    let streak = 0;
    if (goal != null) {
      for (let i = daily.length - 1; i >= 0; i--) {
        const d = daily[i];
        if (d.entryCount === 0 || d.netCalories > goal) {
          // Today doesn't break the streak just because it's not over yet.
          if (d.dayKey === todayKey && d.netCalories <= goal) continue;
          break;
        }
        streak += 1;
      }
    }

    const weekStart = mondayOf(todayKey);
    const thisWeek = daily.filter((d) => d.dayKey >= weekStart);
    const onTargetThisWeek =
      goal != null
        ? thisWeek.filter((d) => d.entryCount > 0 && d.netCalories <= goal).length
        : null;

    return { avg7, loggedDays: logged.length, streak, onTargetThisWeek, weekDays: thisWeek.length };
  }, [daily, goal, todayKey]);

  const chartData = React.useMemo(
    () =>
      daily.slice(-14).map((d) => ({
        day: formatShort(d.dayKey),
        dayKey: d.dayKey,
        net: Math.max(0, d.netCalories),
        logged: d.entryCount > 0,
      })),
    [daily]
  );

  // ── Goal ──────────────────────────────────────────────────────────────────

  async function saveGoal() {
    const value = parseInt(goalDraft, 10);
    if (!Number.isFinite(value)) {
      toast("Enter a goal in kcal, e.g. 2000.", { variant: "error" });
      return;
    }
    setGoalSaving(true);
    const res = await setCalorieGoalAction(value);
    setGoalSaving(false);
    if (res.success && res.data) {
      setGoal(res.data.dailyCalorieGoal);
      setEditingGoal(false);
      toast(`Daily goal set to ${fmt(res.data.dailyCalorieGoal)} kcal.`, { variant: "success" });
    } else {
      toast(res.error ?? "Could not save goal.", { variant: "error" });
    }
  }

  // ── Food form ─────────────────────────────────────────────────────────────

  function pickFoodSuggestion(idx: number) {
    const s = foodSuggestions[idx];
    if (!s) return;
    setFoodForm((f) => ({
      ...f,
      name: s.item.name,
      unit: s.item.unit ?? f.unit,
      caloriesPerUnit: s.item.caloriesPerUnit != null ? String(s.item.caloriesPerUnit) : f.caloriesPerUnit,
      proteinPerUnit: s.item.proteinPerUnit != null ? String(s.item.proteinPerUnit) : f.proteinPerUnit,
      carbsPerUnit: s.item.carbsPerUnit != null ? String(s.item.carbsPerUnit) : f.carbsPerUnit,
    }));
    setFoodSugOpen(false);
    quantityRef.current?.focus();
  }

  /** Autofill unit + kcal from the library when the typed name matches exactly. */
  function autofillFoodFromExactMatch() {
    const key = normalizeName(foodForm.name);
    if (!key || foodForm.caloriesPerUnit !== "") return;
    const match = foodLibrary.find((i) => i.nameKey === key);
    if (!match || match.caloriesPerUnit == null) return;
    setFoodForm((f) => ({
      ...f,
      name: match.name,
      unit: match.unit ?? f.unit,
      caloriesPerUnit: String(match.caloriesPerUnit),
      proteinPerUnit: match.proteinPerUnit != null ? String(match.proteinPerUnit) : f.proteinPerUnit,
      carbsPerUnit: match.carbsPerUnit != null ? String(match.carbsPerUnit) : f.carbsPerUnit,
    }));
  }

  function applyQuickAdd(item: CalorieLibraryItem) {
    setFoodForm({
      name: item.name,
      unit: item.unit ?? "per100g",
      quantity: "",
      caloriesPerUnit: item.caloriesPerUnit != null ? String(item.caloriesPerUnit) : "",
      proteinPerUnit: item.proteinPerUnit != null ? String(item.proteinPerUnit) : "",
      carbsPerUnit: item.carbsPerUnit != null ? String(item.carbsPerUnit) : "",
      editingId: null,
    });
    setFoodSugOpen(false);
    quantityRef.current?.focus();
  }

  function startFoodEdit(entry: CalorieEntry) {
    setFoodForm({
      name: entry.name,
      unit: entry.unit ?? "per100g",
      quantity: entry.quantity != null ? String(entry.quantity) : "",
      caloriesPerUnit: entry.caloriesPerUnit != null ? String(entry.caloriesPerUnit) : "",
      proteinPerUnit: macroPerUnitFromEntry(entry, "protein"),
      carbsPerUnit: macroPerUnitFromEntry(entry, "carbs"),
      editingId: entry.id,
    });
    setFoodSugOpen(false);
  }

  function cancelFoodEdit() {
    setFoodForm(EMPTY_FOOD_FORM);
    setFoodSugOpen(false);
  }

  function mergeLibraryItem(item: CalorieLibraryItem) {
    setLibrary((prev) => {
      const rest = prev.filter((i) => !(i.kind === item.kind && i.nameKey === item.nameKey));
      return [item, ...rest];
    });
  }

  async function submitFood(e: React.FormEvent) {
    e.preventDefault();
    const quantity = parseFloat(foodForm.quantity);
    const caloriesPerUnit = parseFloat(foodForm.caloriesPerUnit);
    const proteinPerUnit = foodForm.proteinPerUnit.trim() ? parseFloat(foodForm.proteinPerUnit) : undefined;
    const carbsPerUnit = foodForm.carbsPerUnit.trim() ? parseFloat(foodForm.carbsPerUnit) : undefined;
    const name = foodForm.name.trim();

    if (!name) return toast("Enter a dish name.", { variant: "error" });
    if (!Number.isFinite(quantity) || quantity <= 0)
      return toast(`Enter ${foodForm.unit === "per100g" ? "weight in grams" : "number of pieces"}.`, { variant: "error" });
    if (!Number.isFinite(caloriesPerUnit) || caloriesPerUnit < 0)
      return toast(`Enter kcal ${foodForm.unit === "per100g" ? "per 100 g" : "per piece"}.`, { variant: "error" });
    if (proteinPerUnit != null && (!Number.isFinite(proteinPerUnit) || proteinPerUnit < 0))
      return toast(`Enter product protein ${foodForm.unit === "per100g" ? "per 100 g" : "per piece"}, or leave it blank.`, { variant: "error" });
    if (carbsPerUnit != null && (!Number.isFinite(carbsPerUnit) || carbsPerUnit < 0))
      return toast(`Enter product carbs ${foodForm.unit === "per100g" ? "per 100 g" : "per piece"}, or leave it blank.`, { variant: "error" });

    setFoodSubmitting(true);
    const input = { name, unit: foodForm.unit, quantity, caloriesPerUnit, proteinPerUnit, carbsPerUnit };
    const res = foodForm.editingId
      ? await updateFoodEntryAction(foodForm.editingId, input)
      : await addFoodEntryAction({ ...input, dayKey: selectedDay });
    setFoodSubmitting(false);

    if (res.success && res.data) {
      const { entry, libraryItem } = res.data;
      setEntries((prev) =>
        foodForm.editingId
          ? prev.map((x) => (x.id === entry.id ? entry : x))
          : [...prev, entry]
      );
      if (detailsOpen && detailsDay === entry.dayKey) {
        setDetailsEntries((prev) =>
          foodForm.editingId
            ? prev.map((x) => (x.id === entry.id ? entry : x))
            : [...prev, entry]
        );
      }
      mergeLibraryItem(libraryItem);
      setFoodForm((f) => ({ ...EMPTY_FOOD_FORM, unit: f.unit }));
      refreshSummaries();
      toast(
        foodForm.editingId
          ? `Updated ${entry.name}.`
          : `Added ${entry.name} · ${fmt(entry.totalCalories)} kcal.`,
        { variant: "success" }
      );
    } else {
      toast(res.error ?? "Could not save entry.", { variant: "error" });
    }
  }

  // ── Exercise form ─────────────────────────────────────────────────────────

  function pickExerciseSuggestion(idx: number) {
    const s = exerciseSuggestions[idx];
    if (!s) return;
    setExForm((f) => ({
      ...f,
      name: s.item.name,
      caloriesBurned:
        s.item.lastCaloriesBurned != null ? String(s.item.lastCaloriesBurned) : f.caloriesBurned,
    }));
    setExSugOpen(false);
    exCaloriesRef.current?.focus();
  }

  function autofillExerciseFromExactMatch() {
    const key = normalizeName(exForm.name);
    if (!key || exForm.caloriesBurned !== "") return;
    const match = exerciseLibrary.find((i) => i.nameKey === key);
    if (!match || match.lastCaloriesBurned == null) return;
    setExForm((f) => ({ ...f, name: match.name, caloriesBurned: String(match.lastCaloriesBurned) }));
  }

  function startExerciseEdit(entry: CalorieEntry) {
    setExForm({
      name: entry.name,
      caloriesBurned: String(entry.totalCalories),
      editingId: entry.id,
    });
    setExSugOpen(false);
  }

  function cancelExerciseEdit() {
    setExForm(EMPTY_EXERCISE_FORM);
    setExSugOpen(false);
  }

  async function submitExercise(e: React.FormEvent) {
    e.preventDefault();
    const caloriesBurned = parseFloat(exForm.caloriesBurned);
    const name = exForm.name.trim();

    if (!name) return toast("Enter an exercise name.", { variant: "error" });
    if (!Number.isFinite(caloriesBurned) || caloriesBurned <= 0)
      return toast("Enter calories burned.", { variant: "error" });

    setExSubmitting(true);
    const res = exForm.editingId
      ? await updateExerciseEntryAction(exForm.editingId, { name, caloriesBurned })
      : await addExerciseEntryAction({ name, caloriesBurned, dayKey: selectedDay });
    setExSubmitting(false);

    if (res.success && res.data) {
      const { entry, libraryItem } = res.data;
      setEntries((prev) =>
        exForm.editingId ? prev.map((x) => (x.id === entry.id ? entry : x)) : [...prev, entry]
      );
      if (detailsOpen && detailsDay === entry.dayKey) {
        setDetailsEntries((prev) =>
          exForm.editingId ? prev.map((x) => (x.id === entry.id ? entry : x)) : [...prev, entry]
        );
      }
      mergeLibraryItem(libraryItem);
      setExForm(EMPTY_EXERCISE_FORM);
      refreshSummaries();
      toast(
        exForm.editingId
          ? `Updated ${entry.name}.`
          : `Added ${entry.name} · ${fmt(entry.totalCalories)} kcal burned.`,
        { variant: "success" }
      );
    } else {
      toast(res.error ?? "Could not save entry.", { variant: "error" });
    }
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  async function deleteEntry(entry: CalorieEntry) {
    const wasInSelectedDay = entry.dayKey === selectedDay;
    const wasInDetailsDay = detailsOpen && entry.dayKey === detailsDay;
    if (wasInSelectedDay) setEntries((prev) => prev.filter((x) => x.id !== entry.id));
    if (wasInDetailsDay) setDetailsEntries((prev) => prev.filter((x) => x.id !== entry.id));
    if (foodForm.editingId === entry.id) cancelFoodEdit();
    if (exForm.editingId === entry.id) cancelExerciseEdit();
    const res = await deleteCalorieEntryAction(entry.id);
    if (res.success) {
      refreshSummaries();
    } else {
      if (wasInSelectedDay) setEntries((prev) => [...prev, entry]); // restore on failure
      if (wasInDetailsDay) setDetailsEntries((prev) => [...prev, entry]);
      toast(res.error ?? "Could not delete entry.", { variant: "error" });
    }
  }

  async function editEntryFromDetails(entry: CalorieEntry) {
    if (entry.dayKey !== selectedDay) {
      await selectDay(entry.dayKey);
    }
    if (entry.kind === "food") {
      startFoodEdit(entry);
    } else {
      startExerciseEdit(entry);
    }
    setDetailsOpen(false);
  }

  async function openDayDetails(dayKey: string) {
    setDetailsOpen(true);
    setDetailsDay(dayKey);

    if (dayKey === selectedDay && !dayLoading) {
      setDetailsEntries(entries);
      setDetailsLoading(false);
      return;
    }

    setDetailsLoading(true);
    setDetailsEntries([]);
    const req = ++detailsReq.current;
    const res = await getDayEntriesAction(dayKey);
    if (req !== detailsReq.current) return;
    if (res.success && res.data) {
      setDetailsEntries(res.data.entries);
    } else {
      setDetailsEntries([]);
      toast(res.error ?? "Could not load that day.", { variant: "error" });
    }
    setDetailsLoading(false);
  }

  function exportCsv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    let header: string[];
    let rows: (string | number)[][];

    if (reportTab === "daily") {
      header = ["Date", "Eaten (kcal)", "Protein (g)", "Carbs (g)", "Burned (kcal)", "Net (kcal)", "Goal (kcal)", "Delta"];
      rows = [...daily].reverse().map((d) => [
        d.dayKey,
        d.foodCalories,
        d.proteinGrams,
        d.carbsGrams,
        d.exerciseCalories,
        d.netCalories,
        goal ?? "",
        goal != null && d.entryCount > 0 ? goal - d.netCalories : "",
      ]);
    } else if (reportTab === "weekly") {
      header = ["Week start", "Week end", "Days logged", "Eaten", "Burned", "Net", "Avg net/day"];
      rows = [...weekly].reverse().map((w) => [
        w.weekStartKey,
        w.weekEndKey,
        w.daysLogged,
        w.foodCalories,
        w.exerciseCalories,
        w.netCalories,
        w.avgNetPerLoggedDay,
      ]);
    } else {
      header = ["Month", "Days logged", "Eaten", "Burned", "Net", "Avg net/day"];
      rows = [...monthly].reverse().map((m) => [
        m.monthKey,
        m.daysLogged,
        m.foodCalories,
        m.exerciseCalories,
        m.netCalories,
        m.avgNetPerLoggedDay,
      ]);
    }

    const csv = [header, ...rows]
      .map((r) => r.map((v) => (typeof v === "string" ? esc(v) : String(v))).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calories-${reportTab}-${todayKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-80 rounded-2xl lg:col-span-3" />
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive">
        Something went wrong loading your calorie data. Please refresh the page.
      </div>
    );
  }

  const isToday = selectedDay === todayKey;
  const goalPct = goal != null && goal > 0 ? Math.min(100, Math.max(0, (net / goal) * 100)) : 0;
  const overGoal = goal != null && net > goal;

  return (
    <div className="space-y-6 sm:space-y-8">
      <DayDetailsModal
        open={detailsOpen}
        dayKey={detailsDay}
        entries={detailsEntries}
        loading={detailsLoading}
        goal={goal}
        todayKey={todayKey}
        onOpenChange={setDetailsOpen}
        onLogDay={() => {
          void selectDay(detailsDay);
          setDetailsOpen(false);
        }}
        onEditEntry={(entry) => {
          void editEntryFromDetails(entry);
        }}
        onDeleteEntry={(entry) => {
          void deleteEntry(entry);
        }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Calories</h1>
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">
            Log what you eat, track what you burn, stay on target.
          </p>
        </div>

        {editingGoal ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={200}
              max={20000}
              autoFocus
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveGoal();
                if (e.key === "Escape") setEditingGoal(false);
              }}
              placeholder="e.g. 2000"
              className="h-9 w-32"
              aria-label="Daily calorie goal"
            />
            <Button size="sm" onClick={saveGoal} disabled={goalSaving}>
              {goalSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingGoal(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setGoalDraft(goal != null ? String(goal) : "");
              setEditingGoal(true);
            }}
            className="flex items-center gap-2 rounded-full border border-state-today/20 bg-state-today/10 px-4 py-2 text-sm font-medium text-state-today transition-colors hover:bg-state-today/15"
          >
            <Target className="h-4 w-4" />
            {goal != null ? (
              <>
                {fmt(goal)} kcal/day
                <Pencil className="h-3 w-3 opacity-60" />
              </>
            ) : (
              "Set daily goal"
            )}
          </button>
        )}
      </div>

      {/* Date navigator */}
      <Card className="flex flex-wrap items-center gap-2 p-3 shadow-card sm:gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => selectDay(shiftDay(selectedDay, -1))}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-state-today" />
          <span className="text-sm font-semibold text-forest-slate">
            {isToday ? "Today" : formatDayLabel(selectedDay)}
          </span>
          {isToday && <span className="text-xs text-mossy-gray">· {formatDayLabel(selectedDay)}</span>}
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => selectDay(shiftDay(selectedDay, 1))}
          disabled={isToday}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <input
          type="date"
          value={selectedDay}
          max={todayKey}
          onChange={(e) => {
            const v = e.target.value;
            if (v && v <= todayKey) selectDay(v);
          }}
          className="h-7 rounded-lg border border-border bg-surface px-2 text-xs text-forest-slate outline-none focus-visible:ring-2 focus-visible:ring-state-today/50"
          aria-label="Jump to date"
        />
        {!isToday && (
          <Button size="sm" variant="emerald" onClick={() => selectDay(todayKey)}>
            Back to today
          </Button>
        )}
        {dayLoading && <Loader2 className="h-4 w-4 animate-spin text-mossy-gray" />}
      </Card>

      {/* Day summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        <IconStat icon={Utensils} label="Eaten" value={fmt(eaten)} sub="kcal" color="text-state-today" />
        <IconStat icon={Activity} label="Protein" value={fmtMacro(protein)} sub="g" color="text-state-completed" />
        <IconStat icon={Activity} label="Carbs" value={fmtMacro(carbs)} sub="g" color="text-state-upcoming" />
        <IconStat icon={Flame} label="Burned" value={fmt(burned)} sub="kcal" color="text-state-stale" />
        <IconStat icon={Activity} label="Net" value={fmt(net)} sub="eaten − burned" color="text-state-upcoming" />
        {goal != null && remaining != null ? (
          <IconStat
            icon={Target}
            label={remaining >= 0 ? "Left today" : "Over goal"}
            value={fmt(Math.abs(remaining))}
            sub="kcal"
            color={remaining >= 0 ? "text-state-completed" : "text-destructive"}
          />
        ) : (
          <Card className="flex items-center gap-3 p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas">
              <Target className="h-5 w-5 text-mossy-gray" />
            </div>
            <div className="text-xs text-mossy-gray">
              Set a daily goal to track your deficit.
            </div>
          </Card>
        )}
      </div>

      {/* Goal progress */}
      {goal != null && (
        <Card className="p-4 shadow-card">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-mossy-gray">
              {isToday ? "Today's budget" : `Budget on ${formatShort(selectedDay)}`}
            </span>
            <span className="font-mono text-xs tabular-nums text-mossy-gray">
              {fmt(net)} / {fmt(goal)} kcal
              <span className={cn("ml-2 font-semibold", overGoal ? "text-destructive" : "text-state-today")}>
                {overGoal ? `${fmt(net - goal)} over` : `${fmt(goal - net)} left`}
              </span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-canvas">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                overGoal ? "bg-destructive" : "bg-state-today"
              )}
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </Card>
      )}

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <IconStat
          icon={Activity}
          label="7-day avg net"
          value={insights.avg7 != null ? fmt(insights.avg7) : "—"}
          sub="kcal/day"
          color="text-state-upcoming"
        />
        <IconStat
          icon={CalendarDays}
          label="Days logged"
          value={String(insights.loggedDays)}
          sub="last 30 days"
          color="text-state-today"
        />
        <IconStat
          icon={Flame}
          label="On-target streak"
          value={goal != null ? `${insights.streak}d` : "—"}
          sub={goal != null ? "days ≤ goal" : "set a goal"}
          color="text-state-stale"
        />
        <IconStat
          icon={Target}
          label="On target this week"
          value={
            insights.onTargetThisWeek != null
              ? `${insights.onTargetThisWeek}/${insights.weekDays}`
              : "—"
          }
          sub={goal != null ? "days" : "set a goal"}
          color="text-state-completed"
        />
      </div>

      {/* Logs */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Food log */}
        <Card className="p-5 shadow-card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-forest-slate">
              <Utensils className="h-4 w-4 text-state-today" />
              Food log
            </h2>
            <div className="flex flex-wrap justify-end gap-2 font-mono text-xs tabular-nums text-mossy-gray">
              <span>{fmt(eaten)} kcal</span>
              <span>{fmtMacro(protein)}g protein</span>
              <span>{fmtMacro(carbs)}g carbs</span>
            </div>
          </div>

          {quickAdds.length > 0 && !foodForm.editingId && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {quickAdds.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyQuickAdd(item)}
                  className="rounded-full border border-border bg-canvas px-2.5 py-1 text-[11px] font-medium text-mossy-gray transition-colors hover:border-state-today/30 hover:text-state-today"
                  title={`${item.name} product facts · ${fmt(item.caloriesPerUnit ?? 0)} kcal/${item.unit === "perPiece" ? "pc" : "100 g"} · P ${fmtMacro(item.proteinPerUnit ?? 0)}g · C ${fmtMacro(item.carbsPerUnit ?? 0)}g`}
                >
                  + {item.name}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submitFood} className="space-y-2">
            <div className="relative">
              <Input
                value={foodForm.name}
                onChange={(e) => {
                  setFoodForm((f) => ({ ...f, name: e.target.value }));
                  setFoodSugOpen(true);
                  setFoodSugIdx(0);
                }}
                onFocus={() => setFoodSugOpen(true)}
                onBlur={() => {
                  setFoodSugOpen(false);
                  autofillFoodFromExactMatch();
                }}
                onKeyDown={(e) => {
                  if (!foodSugOpen || !foodSuggestions.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFoodSugIdx((i) => (i + 1) % foodSuggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFoodSugIdx((i) => (i - 1 + foodSuggestions.length) % foodSuggestions.length);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    pickFoodSuggestion(foodSugIdx);
                  } else if (e.key === "Escape") {
                    setFoodSugOpen(false);
                  }
                }}
                placeholder="Dish name — e.g. Poha, Roti, Dal"
                aria-label="Dish name"
              />
              {foodSugOpen && (
                <SuggestionList
                  items={foodSuggestions}
                  activeIdx={foodSugIdx}
                  onPick={pickFoodSuggestion}
                />
              )}
            </div>

            <div className="rounded-xl border border-border bg-canvas/60 p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-mossy-gray">
                Product nutrition facts
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={foodForm.unit}
                  onValueChange={(v) => setFoodForm((f) => ({ ...f, unit: v as FoodUnit }))}
                >
                  <SelectTrigger className="w-[130px]" aria-label="Product nutrition unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per100g">Per 100 g</SelectItem>
                    <SelectItem value="perPiece">Per piece</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={foodForm.caloriesPerUnit}
                  onChange={(e) => setFoodForm((f) => ({ ...f, caloriesPerUnit: e.target.value }))}
                  placeholder={foodForm.unit === "per100g" ? "kcal / 100 g" : "kcal / piece"}
                  className="w-28 flex-1 sm:flex-none"
                  aria-label={foodForm.unit === "per100g" ? "Product calories per 100 grams" : "Product calories per piece"}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={foodForm.proteinPerUnit}
                  onChange={(e) => setFoodForm((f) => ({ ...f, proteinPerUnit: e.target.value }))}
                  placeholder={foodForm.unit === "per100g" ? "protein / 100 g" : "protein / piece"}
                  className="w-32 flex-1 sm:flex-none"
                  aria-label={foodForm.unit === "per100g" ? "Product protein per 100 grams" : "Product protein per piece"}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={foodForm.carbsPerUnit}
                  onChange={(e) => setFoodForm((f) => ({ ...f, carbsPerUnit: e.target.value }))}
                  placeholder={foodForm.unit === "per100g" ? "carbs / 100 g" : "carbs / piece"}
                  className="w-32 flex-1 sm:flex-none"
                  aria-label={foodForm.unit === "per100g" ? "Product carbs per 100 grams" : "Product carbs per piece"}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-[160px] flex-1 items-center gap-2 sm:flex-none">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-mossy-gray">
                  Today I ate
                </span>
                <Input
                  ref={quantityRef}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={foodForm.quantity}
                  onChange={(e) => setFoodForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder={foodForm.unit === "per100g" ? "grams" : "pieces"}
                  className="w-24 flex-1 sm:flex-none"
                  aria-label={foodForm.unit === "per100g" ? "Weight eaten in grams" : "Pieces eaten"}
                />
              </div>
              <Button type="submit" size="sm" disabled={foodSubmitting} className="h-9 px-4">
                {foodSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : foodForm.editingId ? (
                  "Save"
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add
                  </>
                )}
              </Button>
              {foodForm.editingId && (
                <Button type="button" size="sm" variant="ghost" onClick={cancelFoodEdit}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
              {(previewTotal != null || previewProtein != null || previewCarbs != null) && (
                <span className="ml-auto font-mono text-xs tabular-nums text-mossy-gray">
                  = {previewTotal != null ? `${fmt(previewTotal)} kcal` : "— kcal"}
                  {previewProtein != null && ` · P ${fmtMacro(previewProtein)}g`}
                  {previewCarbs != null && ` · C ${fmtMacro(previewCarbs)}g`}
                </span>
              )}
            </div>
          </form>

          <ul className="mt-4 space-y-2">
            {dayLoading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            ) : foodEntries.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-mossy-gray">
                Nothing eaten logged {isToday ? "today" : "this day"} yet. Add your first dish above
                — next time it will autofill.
              </li>
            ) : (
              foodEntries.map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border bg-canvas px-3 py-2.5",
                    foodForm.editingId === entry.id && "ring-2 ring-state-today/40"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-forest-slate">{entry.name}</div>
                    <div className="text-[11px] text-mossy-gray">
                      {entry.unit === "perPiece"
                        ? `Ate ${entry.quantity} pc · product ${fmt(entry.caloriesPerUnit ?? 0)} kcal/pc`
                        : `Ate ${entry.quantity} g · product ${fmt(entry.caloriesPerUnit ?? 0)} kcal/100 g`}
                      {(entry.proteinGrams != null || entry.carbsGrams != null) && (
                        <span>
                          {" · "}
                          eaten P {fmtMacro(entry.proteinGrams ?? 0)}g · C {fmtMacro(entry.carbsGrams ?? 0)}g
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-forest-slate">
                    {fmt(entry.totalCalories)}
                    <span className="ml-1 text-[10px] font-normal text-mossy-gray">kcal</span>
                  </span>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => startFoodEdit(entry)}
                      className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-surface hover:text-forest-slate"
                      aria-label={`Edit ${entry.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry)}
                      className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${entry.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        {/* Exercise log */}
        <Card className="p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-forest-slate">
              <Dumbbell className="h-4 w-4 text-state-stale" />
              Exercise
            </h2>
            <span className="font-mono text-xs tabular-nums text-mossy-gray">
              −{fmt(burned)} kcal
            </span>
          </div>

          <form onSubmit={submitExercise} className="space-y-2">
            <div className="relative">
              <Input
                value={exForm.name}
                onChange={(e) => {
                  setExForm((f) => ({ ...f, name: e.target.value }));
                  setExSugOpen(true);
                  setExSugIdx(0);
                }}
                onFocus={() => setExSugOpen(true)}
                onBlur={() => {
                  setExSugOpen(false);
                  autofillExerciseFromExactMatch();
                }}
                onKeyDown={(e) => {
                  if (!exSugOpen || !exerciseSuggestions.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setExSugIdx((i) => (i + 1) % exerciseSuggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setExSugIdx((i) => (i - 1 + exerciseSuggestions.length) % exerciseSuggestions.length);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    pickExerciseSuggestion(exSugIdx);
                  } else if (e.key === "Escape") {
                    setExSugOpen(false);
                  }
                }}
                placeholder="Exercise — e.g. Running, Gym"
                aria-label="Exercise name"
              />
              {exSugOpen && (
                <SuggestionList
                  items={exerciseSuggestions}
                  activeIdx={exSugIdx}
                  onPick={pickExerciseSuggestion}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                ref={exCaloriesRef}
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                value={exForm.caloriesBurned}
                onChange={(e) => setExForm((f) => ({ ...f, caloriesBurned: e.target.value }))}
                placeholder="kcal burned"
                className="w-32 flex-1 sm:flex-none"
                aria-label="Calories burned"
              />
              <Button type="submit" size="sm" disabled={exSubmitting} className="h-9 px-4">
                {exSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : exForm.editingId ? (
                  "Save"
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Add
                  </>
                )}
              </Button>
              {exForm.editingId && (
                <Button type="button" size="sm" variant="ghost" onClick={cancelExerciseEdit}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
            </div>
          </form>

          <ul className="mt-4 space-y-2">
            {dayLoading ? (
              [0, 1].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)
            ) : exerciseEntries.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-mossy-gray">
                No exercise logged {isToday ? "today" : "this day"}.
              </li>
            ) : (
              exerciseEntries.map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border bg-canvas px-3 py-2.5",
                    exForm.editingId === entry.id && "ring-2 ring-state-today/40"
                  )}
                >
                  <div className="min-w-0 flex-1 truncate text-sm font-medium text-forest-slate">
                    {entry.name}
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-state-today">
                    −{fmt(entry.totalCalories)}
                    <span className="ml-1 text-[10px] font-normal text-mossy-gray">kcal</span>
                  </span>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => startExerciseEdit(entry)}
                      className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-surface hover:text-forest-slate"
                      aria-label={`Edit ${entry.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry)}
                      className="rounded-lg p-1.5 text-mossy-gray transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${entry.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* Trend */}
      <Card className="p-5 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-forest-slate">Last 14 days · net calories</h2>
          {goal != null && (
            <span className="text-[11px] text-mossy-gray">
              dashed line = {fmt(goal)} kcal goal
            </span>
          )}
        </div>
        <CalorieTrendChart data={chartData} goal={goal} onDayClick={openDayDetails} />
      </Card>

      {/* Reports */}
      <Card className="p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-forest-slate">Reports</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-border bg-canvas p-0.5">
              {(["daily", "weekly", "monthly"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setReportTab(tab)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    reportTab === tab
                      ? "bg-surface text-forest-slate shadow-soft"
                      : "text-mossy-gray hover:text-forest-slate"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} title="Export current report as CSV">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </div>

        {reportTab === "daily" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 px-3 text-xs">Date</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Eaten</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Protein</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Carbs</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Burned</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Net</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">vs Goal</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...daily].reverse().map((d) => {
                const logged = d.entryCount > 0;
                const delta = goal != null && logged ? goal - d.netCalories : null;
                return (
                  <TableRow
                    key={d.dayKey}
                    className={cn(
                      "cursor-pointer",
                      d.dayKey === todayKey && "bg-state-today/5",
                      !logged && "opacity-50"
                    )}
                    onClick={() => openDayDetails(d.dayKey)}
                    title="View this day's details"
                  >
                    <TableCell className="whitespace-nowrap p-2.5 px-3 text-xs font-medium text-forest-slate">
                      {d.dayKey === todayKey ? "Today" : formatShort(d.dayKey)}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(d.foodCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? `${fmtMacro(d.proteinGrams)}g` : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? `${fmtMacro(d.carbsGrams)}g` : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(d.exerciseCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums text-forest-slate">
                      {logged ? fmt(d.netCalories) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "p-2.5 px-3 text-right font-mono text-xs tabular-nums",
                        delta != null && (delta >= 0 ? "text-state-today" : "text-destructive")
                      )}
                    >
                      {delta != null ? (delta >= 0 ? `${fmt(delta)} under` : `${fmt(-delta)} over`) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right">
                      {!logged ? (
                        <span className="text-xs text-mossy-gray">not logged</span>
                      ) : goal == null ? (
                        <span className="inline-block rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium text-mossy-gray">
                          logged
                        </span>
                      ) : d.netCalories <= goal ? (
                        <span className="inline-block rounded-full bg-state-today/10 px-2 py-0.5 text-[10px] font-medium text-state-today">
                          on target
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          over
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {reportTab === "weekly" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 px-3 text-xs">Week</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Days logged</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Eaten</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Burned</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Net</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Avg net/day</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">vs Goal (avg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...weekly].reverse().map((w, idx) => {
                const logged = w.daysLogged > 0;
                const delta = goal != null && logged ? goal - w.avgNetPerLoggedDay : null;
                return (
                  <TableRow key={w.weekStartKey} className={cn(idx === 0 && "bg-state-today/5", !logged && "opacity-50")}>
                    <TableCell className="whitespace-nowrap p-2.5 px-3 text-xs font-medium text-forest-slate">
                      {formatShort(w.weekStartKey)} – {formatShort(w.weekEndKey)}
                      {idx === 0 && <span className="ml-1.5 text-[10px] text-state-today">(this week)</span>}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {w.daysLogged}/7
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(w.foodCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(w.exerciseCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums text-forest-slate">
                      {logged ? fmt(w.netCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(w.avgNetPerLoggedDay) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "p-2.5 px-3 text-right font-mono text-xs tabular-nums",
                        delta != null && (delta >= 0 ? "text-state-today" : "text-destructive")
                      )}
                    >
                      {delta != null ? (delta >= 0 ? `${fmt(delta)} under` : `${fmt(-delta)} over`) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {reportTab === "monthly" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 px-3 text-xs">Month</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Days logged</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Eaten</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Burned</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Net</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">Avg net/day</TableHead>
                <TableHead className="h-9 px-3 text-right text-xs">vs Goal (avg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...monthly].reverse().map((m, idx) => {
                const logged = m.daysLogged > 0;
                const delta = goal != null && logged ? goal - m.avgNetPerLoggedDay : null;
                return (
                  <TableRow key={m.monthKey} className={cn(idx === 0 && "bg-state-today/5", !logged && "opacity-50")}>
                    <TableCell className="whitespace-nowrap p-2.5 px-3 text-xs font-medium text-forest-slate">
                      {formatMonth(m.monthKey)}
                      {idx === 0 && <span className="ml-1.5 text-[10px] text-state-today">(this month)</span>}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {m.daysLogged}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(m.foodCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(m.exerciseCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums text-forest-slate">
                      {logged ? fmt(m.netCalories) : "—"}
                    </TableCell>
                    <TableCell className="p-2.5 px-3 text-right font-mono text-xs tabular-nums">
                      {logged ? fmt(m.avgNetPerLoggedDay) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "p-2.5 px-3 text-right font-mono text-xs tabular-nums",
                        delta != null && (delta >= 0 ? "text-state-today" : "text-destructive")
                      )}
                    >
                      {delta != null ? (delta >= 0 ? `${fmt(delta)} under` : `${fmt(-delta)} over`) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
