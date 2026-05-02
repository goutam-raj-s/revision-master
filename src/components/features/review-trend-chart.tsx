"use client";

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReviewTrendChartProps {
  data: { day: string; count: number }[];
}

const EMPTY_TOOLTIP = () => null;

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-forest-slate/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg shadow-glass">
      <span className="font-semibold">{label}</span>
      <span className="ml-2 text-white/70">{payload[0].value} review{payload[0].value !== 1 ? "s" : ""}</span>
    </div>
  );
}

export function ReviewTrendChart({ data }: ReviewTrendChartProps) {
  const allZero = data.every((d) => d.count === 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#6b7f73" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#059669", strokeWidth: 1, strokeDasharray: "4 2" }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#reviewGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {allZero && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-mossy-gray/60 italic">No reviews yet this week</span>
        </div>
      )}
    </div>
  );
}
