import { CaloriesClient } from "@/components/features/calories-client";

export const metadata = { title: "Calorie Tracker" };

// All data is fetched client-side so day boundaries follow the user's local
// timezone (dayKey is computed in the browser).
export default function CaloriesPage() {
  return <CaloriesClient />;
}
