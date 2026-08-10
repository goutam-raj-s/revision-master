"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CalorieTrendChartProps {
  data: { day: string; net: number; logged: boolean }[];
  goal: number | null;
}

function CustomTooltip({
  active,
  payload,
  label,
  goal,
}: {
  active?: boolean;
  payload?: { value: number; payload: { logged: boolean } }[];
  label?: string;
  goal: number | null;
}) {
  if (!active || !payload?.length) return null;
  const net = payload[0].value;
  const logged = payload[0].payload.logged;
  const delta = goal != null && logged ? goal - net : null;
  return (
    <div className="bg-ink/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg shadow-glass">
      <span className="font-semibold">{label}</span>
      {logged ? (
        <>
          <span className="ml-2 text-white/70">{net.toLocaleString("en-US")} kcal net</span>
          {delta != null && (
            <span className={`ml-2 ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {delta >= 0
                ? `${delta.toLocaleString("en-US")} under`
                : `${Math.abs(delta).toLocaleString("en-US")} over`}
            </span>
          )}
        </>
      ) : (
        <span className="ml-2 text-white/50 italic">not logged</span>
      )}
    </div>
  );
}

/** Net calories per day (bars) against the daily goal (dashed line). */
export function CalorieTrendChart({ data, goal }: CalorieTrendChartProps) {
  const allEmpty = data.every((d) => !d.logged);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#6b7f73" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax, goal ?? 0) * 1.15]} />
          <Tooltip
            content={<CustomTooltip goal={goal} />}
            cursor={{ fill: "rgba(5, 150, 105, 0.06)" }}
          />
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke="#6b7f73"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{
                value: `goal ${goal.toLocaleString("en-US")}`,
                position: "insideTopRight",
                fontSize: 10,
                fill: "#6b7f73",
              }}
            />
          )}
          <Bar dataKey="net" radius={[4, 4, 0, 0]} maxBarSize={26}>
            {data.map((d) => (
              <Cell
                key={d.day}
                fill={goal != null && d.net > goal ? "#e11d48" : "#059669"}
                fillOpacity={d.logged ? 0.85 : 0.15}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {allEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-mossy-gray/60 italic">
            Log your first meal to see the trend
          </span>
        </div>
      )}
    </div>
  );
}
