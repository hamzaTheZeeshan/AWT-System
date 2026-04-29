import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./DonationCharts.css";

interface PerTypeEntry {
  type_name: string;
  total_amount: number;
}

interface Totals {
  total_clothes_items: number;
  total_books_items: number;
}

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

// Color map — money types get green shades, items keep their original colors
const TYPE_COLORS: Record<string, string> = {
  Money: "#2D4A3E",
  Zakat: "#4a7c64",
  Sadqah: "#7aab90",
  Clothes: "#f0a055",
  Books: "#e07070",
};

// Fallback for any unexpected type name
const moneyColor = (name: string) =>
  TYPE_COLORS[name] ?? "#2D4A3E";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    const isItems = ["Clothes", "Books"].includes(d.name);
    return (
      <div className="dc-tooltip">
        <p className="dc-tooltip-label">{d.name}</p>
        <p className="dc-tooltip-value">
          {isItems
            ? `${Number(d.value).toLocaleString()} items`
            : `PKR ${Number(d.value).toLocaleString()}`}
        </p>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="dc-tooltip">
        <p className="dc-tooltip-label">{label}</p>
        {payload.map((p: any) => {
          const isItems = ["clothes", "books"].includes(p.dataKey);
          return (
            <p key={p.dataKey} className="dc-tooltip-value" style={{ color: p.fill }}>
              {p.name}:{" "}
              {isItems
                ? `${Number(p.value).toLocaleString()} items`
                : `PKR ${Number(p.value).toLocaleString()}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y} fill="#fff"
      textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const DonationCharts: React.FC = () => {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [perType, setPerType] = useState<PerTypeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/donations/total", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch totals");
        const data = await res.json();
        setTotals(data.totals);
        setPerType(data.perType ?? []);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchTotals();
  }, []);

  if (loading) {
    return (
      <div className="dc-loading">
        <div className="dc-spinner" />
        <p>Loading charts…</p>
      </div>
    );
  }

  if (error || !totals) {
    return (
      <div className="dc-error">
        <span>⚠️</span>
        <p>{error ?? "No data available"}</p>
      </div>
    );
  }

  /* ── Derived data ───────────────────────────────────────── */

  // Money types from perType (Zakat, Sadqah, Khairat)
  const moneyTypes = perType
    .map((t) => ({ ...t, total_amount: Number(t.total_amount) }))  // ← add this line
    .filter((t) => t.total_amount > 0);
  const totalMoney = moneyTypes.reduce((sum, t) => sum + t.total_amount, 0);

  // Bar chart: one row per money type + clothes + books
  const barData = [
    ...moneyTypes.map((t) => ({
      category: t.type_name,
      amount: t.total_amount,
      isItems: false,
      color: moneyColor(t.type_name),
    })),
    {
      category: "Clothes",
      amount: totals.total_clothes_items,
      isItems: true,
      color: TYPE_COLORS["Clothes"],
    },
    {
      category: "Books",
      amount: totals.total_books_items,
      isItems: true,
      color: TYPE_COLORS["Books"],
    },
  ].filter((d) => d.amount > 0);

  // Pie chart entries
  const pieData: ChartEntry[] = [
    ...moneyTypes.map((t) => ({
      name: t.type_name,
      value: Number(t.total_amount),  // ← add Number()
      color: moneyColor(t.type_name),
    })),
    { name: "Clothes", value: Number(totals.total_clothes_items), color: TYPE_COLORS["Clothes"] },
    { name: "Books", value: Number(totals.total_books_items), color: TYPE_COLORS["Books"] },
  ].filter((d) => d.value > 0);

  const grandTotal = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="dc-wrapper">
      {/* Header */}
      <div className="dc-header">
        <div className="dc-header-icon">A</div>
        <div>
          <p className="dc-header-label">AWT SYSTEM</p>
          <h2 className="dc-header-title">Donation Overview</h2>
          <p className="dc-header-sub">Approved totals across all categories</p>
        </div>
      </div>

      {/* Summary stats — money types + items */}
      <div className="dc-stats" style={{ gridTemplateColumns: `repeat(${moneyTypes.length + 2}, 1fr)` }}>
        {moneyTypes.map((t) => (
          <div key={t.type_name} className="dc-stat-card">
            <span className="dc-stat-value" style={{ color: moneyColor(t.type_name) }}>
              PKR {t.total_amount.toLocaleString()}
            </span>
            <span className="dc-stat-label">{t.type_name}</span>
          </div>
        ))}
        <div className="dc-stat-card">
          <span className="dc-stat-value dc-stat-clothes">
            {totals.total_clothes_items.toLocaleString()}
          </span>
          <span className="dc-stat-label">Clothes Items</span>
        </div>
        <div className="dc-stat-card">
          <span className="dc-stat-value dc-stat-books">
            {totals.total_books_items.toLocaleString()}
          </span>
          <span className="dc-stat-label">Books</span>
        </div>
      </div>

      {/* Charts grid */}
      <div className="dc-charts-grid">
        {/* Bar chart */}
        <div className="dc-chart-card">
          <p className="dc-chart-title">Total Donations</p>
          <p className="dc-chart-sub">Approved amounts by category</p>

          {/* Dynamic legend */}
          <div className="dc-bar-legend">
            {barData.map((d) => (
              <span key={d.category} className="dc-legend-item">
                <span className="dc-legend-dot" style={{ background: d.color }} />
                {d.category}{d.isItems ? " (items)" : " (PKR)"}
              </span>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barCategoryGap="40%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.07)" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const entry = barData.find((d) => d.category === label);
                  return (
                    <div className="dc-tooltip">
                      <p className="dc-tooltip-label">{label}</p>
                      <p className="dc-tooltip-value">
                        {entry?.isItems
                          ? `${Number(payload[0].value).toLocaleString()} items`
                          : `PKR ${Number(payload[0].value).toLocaleString()}`}
                      </p>
                    </div>
                  );
                }}
                cursor={{ fill: "rgba(45,74,62,0.05)" }}
              />
              <Bar dataKey="amount" radius={[5, 5, 0, 0]} isAnimationActive>
                {barData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="dc-chart-card">
          <p className="dc-chart-title">Distribution by Type</p>
          <p className="dc-chart-sub">Share of each donation category</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={65} outerRadius={100}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="square" iconSize={10}
                formatter={(value: string) => (
                  <span style={{ fontSize: 12, color: "var(--text-mid, #4a6358)" }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Breakdown rows */}
          <div className="dc-breakdown">
            {pieData.map((d) => {
              const pct = grandTotal > 0
                ? ((d.value / grandTotal) * 100).toFixed(1)
                : "0";
              return (
                <div key={d.name} className="dc-breakdown-row">
                  <span className="dc-breakdown-dot" style={{ background: d.color }} />
                  <span className="dc-breakdown-name">{d.name}</span>
                  <span className="dc-breakdown-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationCharts;
