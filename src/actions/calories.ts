"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getCalorieEntriesCollection,
  getCalorieLibraryCollection,
  getCalorieSettingsCollection,
  serializeCalorieEntry,
  serializeCalorieLibraryItem,
} from "@/lib/db/collections";
import type {
  ActionResult,
  CalorieDaySummary,
  CalorieEntry,
  CalorieLibraryItem,
  CalorieMonthSummary,
  CalorieWeekSummary,
  CaloriesOverview,
  DbCalorieLibraryItem,
  FoodUnit,
} from "@/types";

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LEN = 120;
const MAX_KCAL = 100_000;
const MAX_QUANTITY = 100_000;
const DAILY_REPORT_DAYS = 30;
const WEEKLY_REPORT_WEEKS = 8;
const MONTHLY_REPORT_MONTHS = 6;

export interface FoodEntryInput {
  dayKey: string;
  name: string;
  unit: FoodUnit;
  /** Grams when per100g, pieces when perPiece. */
  quantity: number;
  /** kcal per 100 g or per piece. */
  caloriesPerUnit: number;
}

export interface ExerciseEntryInput {
  dayKey: string;
  name: string;
  caloriesBurned: number;
}

export interface EntryWithLibrary {
  entry: CalorieEntry;
  libraryItem: CalorieLibraryItem;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function isValidNumber(n: unknown, max: number): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0 && n <= max;
}

/** Like isValidNumber but allows 0 (zero-calorie foods: water, diet drinks). */
function isValidNonNegative(n: unknown, max: number): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
}

function computeFoodTotal(unit: FoodUnit, quantity: number, caloriesPerUnit: number): number {
  const total = unit === "per100g" ? (quantity / 100) * caloriesPerUnit : quantity * caloriesPerUnit;
  return Math.round(total);
}

function validateFoodInput(input: FoodEntryInput): string | null {
  if (!DAY_KEY_RE.test(input.dayKey)) return "Invalid date.";
  const name = input.name?.trim();
  if (!name || name.length > MAX_NAME_LEN) return "Dish name is required.";
  if (input.unit !== "per100g" && input.unit !== "perPiece") return "Invalid unit.";
  if (!isValidNumber(input.quantity, MAX_QUANTITY)) return "Quantity must be a positive number.";
  if (!isValidNonNegative(input.caloriesPerUnit, MAX_KCAL)) return "Calories can't be negative.";
  return null;
}

function validateExerciseInput(input: ExerciseEntryInput): string | null {
  if (!DAY_KEY_RE.test(input.dayKey)) return "Invalid date.";
  const name = input.name?.trim();
  if (!name || name.length > MAX_NAME_LEN) return "Exercise name is required.";
  if (!isValidNumber(input.caloriesBurned, MAX_KCAL)) return "Calories burned must be a positive number.";
  return null;
}

/** Shift a YYYY-MM-DD key by `days`, independent of server timezone. */
function shiftDayKey(dayKey: string, days: number): string {
  const d = new Date(`${dayKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing dayKey. */
function mondayOf(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  return shiftDayKey(dayKey, -dow);
}

/** Shift a YYYY-MM key by `months`. */
function shiftMonthKey(monthKey: string, months: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

async function upsertLibraryItem(
  userId: ObjectId,
  kind: "food" | "exercise",
  name: string,
  values: { unit?: FoodUnit; caloriesPerUnit?: number; lastCaloriesBurned?: number },
  countAsLog: boolean
): Promise<DbCalorieLibraryItem | null> {
  const library = await getCalorieLibraryCollection();
  const now = new Date();
  const nameKey = normalizeName(name);

  return library.findOneAndUpdate(
    { userId, kind, nameKey },
    {
      $set: {
        name: name.trim(),
        ...values,
        lastLoggedAt: now,
        updatedAt: now,
      },
      ...(countAsLog ? { $inc: { timesLogged: 1 } } : {}),
      $setOnInsert: {
        _id: new ObjectId(),
        userId,
        kind,
        nameKey,
        createdAt: now,
        ...(countAsLog ? {} : { timesLogged: 1 }),
      },
    },
    { upsert: true, returnDocument: "after" }
  );
}

// ─── Reads ─────────────────────────────────────────────────────────────────────

/** Entries for one calendar day, oldest first. */
export async function getDayEntriesAction(
  dayKey: string
): Promise<ActionResult<{ entries: CalorieEntry[] }>> {
  const user = await requireAuth();
  if (!DAY_KEY_RE.test(dayKey)) return { success: false, error: "Invalid date." };

  const col = await getCalorieEntriesCollection();
  const rows = await col
    .find({ userId: new ObjectId(user.id), dayKey })
    .sort({ createdAt: 1 })
    .toArray();

  return { success: true, data: { entries: rows.map(serializeCalorieEntry) } };
}

/**
 * Everything the calories page needs in one round trip. `todayKey` is the
 * client's local calendar day so reports line up with the user's timezone.
 */
export async function getCaloriesOverviewAction(
  todayKey: string
): Promise<ActionResult<CaloriesOverview>> {
  const user = await requireAuth();
  if (!DAY_KEY_RE.test(todayKey)) return { success: false, error: "Invalid date." };

  const userId = new ObjectId(user.id);
  const [entriesCol, libraryCol, settingsCol] = await Promise.all([
    getCalorieEntriesCollection(),
    getCalorieLibraryCollection(),
    getCalorieSettingsCollection(),
  ]);

  // Widest window any report needs: 6 calendar months back.
  const rangeStart = `${shiftMonthKey(todayKey.slice(0, 7), -(MONTHLY_REPORT_MONTHS - 1))}-01`;

  const [settings, dayEntries, library, perDay] = await Promise.all([
    settingsCol.findOne({ userId }),
    entriesCol.find({ userId, dayKey: todayKey }).sort({ createdAt: 1 }).toArray(),
    libraryCol.find({ userId }).sort({ timesLogged: -1, lastLoggedAt: -1 }).limit(300).toArray(),
    entriesCol
      .aggregate<{ _id: string; food: number; exercise: number; count: number }>([
        { $match: { userId, dayKey: { $gte: rangeStart, $lte: todayKey } } },
        {
          $group: {
            _id: "$dayKey",
            food: { $sum: { $cond: [{ $eq: ["$kind", "food"] }, "$totalCalories", 0] } },
            exercise: { $sum: { $cond: [{ $eq: ["$kind", "exercise"] }, "$totalCalories", 0] } },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
  ]);

  const byDay = new Map(perDay.map((d) => [d._id, d]));
  const summaryFor = (dayKey: string): CalorieDaySummary => {
    const d = byDay.get(dayKey);
    const food = d?.food ?? 0;
    const exercise = d?.exercise ?? 0;
    return {
      dayKey,
      foodCalories: food,
      exerciseCalories: exercise,
      netCalories: food - exercise,
      entryCount: d?.count ?? 0,
    };
  };

  // Daily: last 30 days, zero-filled, oldest→newest.
  const daily: CalorieDaySummary[] = [];
  for (let i = DAILY_REPORT_DAYS - 1; i >= 0; i--) {
    daily.push(summaryFor(shiftDayKey(todayKey, -i)));
  }

  // Weekly: last 8 weeks (current week last).
  const thisMonday = mondayOf(todayKey);
  const weekly: CalorieWeekSummary[] = [];
  for (let w = WEEKLY_REPORT_WEEKS - 1; w >= 0; w--) {
    const weekStartKey = shiftDayKey(thisMonday, -7 * w);
    const weekEndKey = shiftDayKey(weekStartKey, 6);
    let food = 0, exercise = 0, daysLogged = 0;
    for (let i = 0; i < 7; i++) {
      const key = shiftDayKey(weekStartKey, i);
      if (key > todayKey) break;
      const s = summaryFor(key);
      food += s.foodCalories;
      exercise += s.exerciseCalories;
      if (s.entryCount > 0) daysLogged += 1;
    }
    const net = food - exercise;
    weekly.push({
      weekStartKey,
      weekEndKey,
      daysLogged,
      foodCalories: food,
      exerciseCalories: exercise,
      netCalories: net,
      avgNetPerLoggedDay: daysLogged ? Math.round(net / daysLogged) : 0,
    });
  }

  // Monthly: last 6 months (current month last).
  const monthTotals = new Map<string, { food: number; exercise: number; daysLogged: number }>();
  for (const d of perDay) {
    const monthKey = d._id.slice(0, 7);
    const m = monthTotals.get(monthKey) ?? { food: 0, exercise: 0, daysLogged: 0 };
    m.food += d.food;
    m.exercise += d.exercise;
    if (d.count > 0) m.daysLogged += 1;
    monthTotals.set(monthKey, m);
  }
  const thisMonth = todayKey.slice(0, 7);
  const monthly: CalorieMonthSummary[] = [];
  for (let i = MONTHLY_REPORT_MONTHS - 1; i >= 0; i--) {
    const monthKey = shiftMonthKey(thisMonth, -i);
    const m = monthTotals.get(monthKey) ?? { food: 0, exercise: 0, daysLogged: 0 };
    const net = m.food - m.exercise;
    monthly.push({
      monthKey,
      daysLogged: m.daysLogged,
      foodCalories: m.food,
      exerciseCalories: m.exercise,
      netCalories: net,
      avgNetPerLoggedDay: m.daysLogged ? Math.round(net / m.daysLogged) : 0,
    });
  }

  return {
    success: true,
    data: {
      dailyCalorieGoal: settings?.dailyCalorieGoal ?? null,
      dayEntries: dayEntries.map(serializeCalorieEntry),
      library: library.map(serializeCalorieLibraryItem),
      daily,
      weekly,
      monthly,
    },
  };
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function addFoodEntryAction(
  input: FoodEntryInput
): Promise<ActionResult<EntryWithLibrary>> {
  const user = await requireAuth();
  const error = validateFoodInput(input);
  if (error) return { success: false, error };

  const userId = new ObjectId(user.id);
  const now = new Date();
  const name = input.name.trim();

  const col = await getCalorieEntriesCollection();
  const doc = {
    _id: new ObjectId(),
    userId,
    dayKey: input.dayKey,
    kind: "food" as const,
    name,
    nameKey: normalizeName(name),
    unit: input.unit,
    quantity: input.quantity,
    caloriesPerUnit: input.caloriesPerUnit,
    totalCalories: computeFoodTotal(input.unit, input.quantity, input.caloriesPerUnit),
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);

  const libraryItem = await upsertLibraryItem(
    userId,
    "food",
    name,
    { unit: input.unit, caloriesPerUnit: input.caloriesPerUnit },
    true
  );

  revalidatePath("/calories");
  return {
    success: true,
    data: {
      entry: serializeCalorieEntry(doc),
      libraryItem: serializeCalorieLibraryItem(libraryItem!),
    },
  };
}

export async function addExerciseEntryAction(
  input: ExerciseEntryInput
): Promise<ActionResult<EntryWithLibrary>> {
  const user = await requireAuth();
  const error = validateExerciseInput(input);
  if (error) return { success: false, error };

  const userId = new ObjectId(user.id);
  const now = new Date();
  const name = input.name.trim();

  const col = await getCalorieEntriesCollection();
  const doc = {
    _id: new ObjectId(),
    userId,
    dayKey: input.dayKey,
    kind: "exercise" as const,
    name,
    nameKey: normalizeName(name),
    totalCalories: Math.round(input.caloriesBurned),
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);

  const libraryItem = await upsertLibraryItem(
    userId,
    "exercise",
    name,
    { lastCaloriesBurned: Math.round(input.caloriesBurned) },
    true
  );

  revalidatePath("/calories");
  return {
    success: true,
    data: {
      entry: serializeCalorieEntry(doc),
      libraryItem: serializeCalorieLibraryItem(libraryItem!),
    },
  };
}

export async function updateFoodEntryAction(
  entryId: string,
  input: Omit<FoodEntryInput, "dayKey">
): Promise<ActionResult<EntryWithLibrary>> {
  const user = await requireAuth();
  const error = validateFoodInput({ ...input, dayKey: "2000-01-01" });
  if (error) return { success: false, error };
  if (!ObjectId.isValid(entryId)) return { success: false, error: "Invalid entry." };

  const userId = new ObjectId(user.id);
  const col = await getCalorieEntriesCollection();
  const name = input.name.trim();
  const now = new Date();

  const updated = await col.findOneAndUpdate(
    { _id: new ObjectId(entryId), userId, kind: "food" },
    {
      $set: {
        name,
        nameKey: normalizeName(name),
        unit: input.unit,
        quantity: input.quantity,
        caloriesPerUnit: input.caloriesPerUnit,
        totalCalories: computeFoodTotal(input.unit, input.quantity, input.caloriesPerUnit),
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );
  if (!updated) return { success: false, error: "Entry not found." };

  // Keep the library in sync so future autofill uses the corrected values.
  const libraryItem = await upsertLibraryItem(
    userId,
    "food",
    name,
    { unit: input.unit, caloriesPerUnit: input.caloriesPerUnit },
    false
  );

  revalidatePath("/calories");
  return {
    success: true,
    data: {
      entry: serializeCalorieEntry(updated),
      libraryItem: serializeCalorieLibraryItem(libraryItem!),
    },
  };
}

export async function updateExerciseEntryAction(
  entryId: string,
  input: Omit<ExerciseEntryInput, "dayKey">
): Promise<ActionResult<EntryWithLibrary>> {
  const user = await requireAuth();
  const error = validateExerciseInput({ ...input, dayKey: "2000-01-01" });
  if (error) return { success: false, error };
  if (!ObjectId.isValid(entryId)) return { success: false, error: "Invalid entry." };

  const userId = new ObjectId(user.id);
  const col = await getCalorieEntriesCollection();
  const name = input.name.trim();

  const updated = await col.findOneAndUpdate(
    { _id: new ObjectId(entryId), userId, kind: "exercise" },
    {
      $set: {
        name,
        nameKey: normalizeName(name),
        totalCalories: Math.round(input.caloriesBurned),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  if (!updated) return { success: false, error: "Entry not found." };

  const libraryItem = await upsertLibraryItem(
    userId,
    "exercise",
    name,
    { lastCaloriesBurned: Math.round(input.caloriesBurned) },
    false
  );

  revalidatePath("/calories");
  return {
    success: true,
    data: {
      entry: serializeCalorieEntry(updated),
      libraryItem: serializeCalorieLibraryItem(libraryItem!),
    },
  };
}

export async function deleteCalorieEntryAction(entryId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(entryId)) return { success: false, error: "Invalid entry." };

  const col = await getCalorieEntriesCollection();
  const res = await col.deleteOne({
    _id: new ObjectId(entryId),
    userId: new ObjectId(user.id),
  });
  if (res.deletedCount === 0) return { success: false, error: "Entry not found." };

  revalidatePath("/calories");
  return { success: true };
}

export async function setCalorieGoalAction(
  dailyCalorieGoal: number
): Promise<ActionResult<{ dailyCalorieGoal: number }>> {
  const user = await requireAuth();
  if (
    typeof dailyCalorieGoal !== "number" ||
    !Number.isFinite(dailyCalorieGoal) ||
    dailyCalorieGoal < 200 ||
    dailyCalorieGoal > 20_000
  ) {
    return { success: false, error: "Goal must be between 200 and 20,000 kcal." };
  }

  const goal = Math.round(dailyCalorieGoal);
  const col = await getCalorieSettingsCollection();
  const userId = new ObjectId(user.id);
  const now = new Date();

  await col.updateOne(
    { userId },
    {
      $set: { dailyCalorieGoal: goal, updatedAt: now },
      $setOnInsert: { _id: new ObjectId(), userId, createdAt: now },
    },
    { upsert: true }
  );

  revalidatePath("/calories");
  return { success: true, data: { dailyCalorieGoal: goal } };
}
