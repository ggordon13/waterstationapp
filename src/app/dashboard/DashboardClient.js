"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getIsoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function parseIsoWeek(week) {
  const [yearStr, weekStr] = week.split("-W");
  const year = Number(yearStr);
  const weekNumber = Number(weekStr);
  const january4 = new Date(year, 0, 4);
  const dayOfWeek = january4.getDay() || 7;
  const mondayOfWeek1 = new Date(january4);
  mondayOfWeek1.setDate(january4.getDate() - dayOfWeek + 1);
  const start = new Date(mondayOfWeek1);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  return startOfDay(start);
}

function formatRangeLabel(period, value, range) {
  if (period === "date") {
    return new Date(value).toLocaleDateString();
  }
  if (period === "week") {
    return `${value.replace("-W", " week ")} (${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()})`;
  }
  if (period === "month") {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return `${date.toLocaleString("default", { month: "long" })} ${year}`;
  }
  return value;
}

function getRange(period, ref = null) {
  const now = ref ? new Date(ref) : new Date();
  if (period === "date") {
    const date = new Date(ref || now.toISOString().slice(0, 10));
    return { start: startOfDay(date), end: endOfDay(date) };
  }
  if (period === "week") {
    const start = parseIsoWeek(ref || `${now.getFullYear()}-W${String(getIsoWeekNumber(now)).padStart(2, "0")}`);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end: endOfDay(end) };
  }
  if (period === "month") {
    const [year, month] = (ref || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-");
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    return { start, end };
  }
  const year = Number(ref || now.getFullYear());
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export default function DashboardClient() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [period, setPeriod] = useState("date");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedWeek, setSelectedWeek] = useState(`${new Date().getFullYear()}-W${String(getIsoWeekNumber(new Date())).padStart(2, "0")}`);
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [isExporting, setIsExporting] = useState(false);
  const axisColor = "#f8fafc";
  const axisSurface = "#0f172a";

  useEffect(() => {
    async function fetchAll() {
      try {
        const [oRes, cRes] = await Promise.all([fetch("/api/orders"), fetch("/api/customers")]);
        const oText = await oRes.text();
        const cText = await cRes.text();
        const oData = oText ? JSON.parse(oText) : [];
        const cData = cText ? JSON.parse(cText) : [];

        const normOrders = Array.isArray(oData)
          ? oData.map((it) => ({ ...it, date: it.date || it.createdAt }))
          : (oData.Items || []);

        setOrders(normOrders);
        setCustomers(Array.isArray(cData) ? cData : (cData.Items || []));
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    }

    fetchAll();
  }, []);

  const selectedValue = useMemo(() => {
    if (period === "date") return selectedDate;
    if (period === "week") return selectedWeek;
    if (period === "month") return selectedMonth;
    return selectedYear;
  }, [period, selectedDate, selectedWeek, selectedMonth, selectedYear]);

  const range = useMemo(() => getRange(period, selectedValue), [period, selectedValue]);
  const rangeLabel = useMemo(() => formatRangeLabel(period, selectedValue, range), [period, selectedValue, range]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      try {
        const d = new Date(o.date || o.createdAt);
        return d >= range.start && d <= range.end;
      } catch (e) {
        return false;
      }
    });
  }, [orders, range]);

  const totalOrders = filtered.length;
  const totalRevenue = filtered.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const activeCustomers = new Set(filtered.map((it) => it.customer)).size;

  const exportOrders = useMemo(() => {
    const ordersForRange = filtered.map((order) => ({
      ...order,
      completedAt: order.completedAt || order.completed_at || "",
      createdAt: order.createdAt || order.date || order.created_at || "",
    }));

    return ordersForRange.sort((a, b) => {
      const aCompleted = a.completedAt ? new Date(a.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bCompleted = b.completedAt ? new Date(b.completedAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;
      if (a.status === "PENDING" && b.status !== "PENDING") return 1;
      if (b.status === "PENDING" && a.status !== "PENDING") return -1;
      return new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime();
    });
  }, [filtered]);

  const completedOrdersForSummary = useMemo(() => {
    return filtered.filter((order) => order.status === "COMPLETED" || (order.completedAt && order.status !== "PENDING"));
  }, [filtered]);

  const driverTotalsForExport = useMemo(() => {
    const map = {};
    exportOrders.forEach((order) => {
      const driver = order.deliveredBy || order.deliveryBy || order.delivery_person || "Unassigned";
      if (!map[driver]) {
        map[driver] = { driver, quantity: 0, amount: 0 };
      }
      map[driver].quantity += Number(order.quantity) || 0;
      map[driver].amount += Number(order.amount) || 0;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount || b.quantity - a.quantity || a.driver.localeCompare(b.driver));
  }, [exportOrders]);

  const handleExportPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 36;
      doc.setFontSize(22);
      doc.text("Water Station Dashboard Export", margin, 40);
      doc.setFontSize(12);
      doc.text(`Selection: ${period.toUpperCase()} — ${rangeLabel}`, margin, 64);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 80);

      const completedTableRows = exportOrders.map((order) => [
        order.customer || "—",
        order.tag || "UNASSIGNED",
        order.mode || "PICKUP",
        order.mop || order.MOP || order.modeOfPayment || "—",
        String(order.quantity ?? 0),
        `₱${Number(order.amount || 0).toLocaleString()}`,
        formatDateTime(order.createdAt),
        formatDateTime(order.completedAt),
        order.status || "UNKNOWN",
      ]);

      autoTable(doc, {
        head: [["Customer", "Tag", "Mode", "MOP", "Qty", "Amount", "Date Created", "Date Completed", "Status"]],
        body: completedTableRows,
        startY: 110,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: margin, right: margin },
      });

      let y = doc.lastAutoTable.finalY + 24;
      doc.setFontSize(12);
      doc.text("Data Summary", margin, y);
      y += 8;

      autoTable(doc, {
        head: [["Metric", "Value"]],
        body: [
          ["Total Completed Orders", String(completedOrdersForSummary.length)],
          ["Total Cash", `₱${completedOrdersForSummary.filter((order) => (order.mop || order.MOP || order.modeOfPayment) === "Cash").reduce((sum, order) => sum + (Number(order.amount) || 0), 0).toLocaleString()}`],
          ["Total Gcash", `₱${completedOrdersForSummary.filter((order) => (order.mop || order.MOP || order.modeOfPayment) === "Gcash").reduce((sum, order) => sum + (Number(order.amount) || 0), 0).toLocaleString()}`],
        ],
        startY: y,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable.finalY + 24;
      doc.setFontSize(12);
      doc.text("Amount and Quantity Total per Driver", margin, y);
      y += 8;

      autoTable(doc, {
        head: [["Driver", "Total Qty", "Total Amount"]],
        body: driverTotalsForExport.map((row) => [
          row.driver,
          String(row.quantity),
          `₱${row.amount.toLocaleString()}`,
        ]),
        startY: y,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: margin, right: margin },
      });

      const fileNameValue = selectedValue.replace(/:/g, "-").replace(/\//g, "-");
      doc.save(`dashboard-${period}-${fileNameValue}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF", error);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const qtyByTag = useMemo(() => {
    const m = {};
    filtered.forEach((it) => {
      const tag = it.tag || "UNASSIGNED";
      m[tag] = (m[tag] || 0) + (Number(it.quantity) || 0);
    });
    return Object.entries(m).map(([tag, qty]) => ({ tag, qty }));
  }, [filtered]);

  const qtyByMode = useMemo(() => {
    const m = {};
    filtered.forEach((it) => {
      const mode = (it.mode || "PICKUP").toUpperCase();
      m[mode] = (m[mode] || 0) + (Number(it.quantity) || 0);
    });
    return Object.entries(m).map(([mode, qty]) => ({ mode, qty }));
  }, [filtered]);

  const chartData = useMemo(() => {
    // group by date string
    const map = {};
    filtered.forEach((it) => {
      const d = new Date(it.date || it.createdAt);
      const key = d.toISOString().slice(0, 10);
      map[key] = (map[key] || 0) + (Number(it.amount) || 0);
    });
    return Object.keys(map)
      .sort()
      .map((k) => ({ date: k, revenue: map[k] }));
  }, [filtered]);

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-4 md:w-full md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Dashboard</h1>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300/80 md:hidden">Operations Overview</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300/10 bg-slate-900 p-3 md:flex-nowrap md:justify-end">
            <label className="text-sm text-slate-400">Show:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 sm:w-auto"
            >
              <option value="date">Date</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>

            {period === "date" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 sm:w-auto"
              />
            )}
            {period === "week" && (
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 sm:w-auto"
              />
            )}
            {period === "month" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 sm:w-auto"
              />
            )}
            {period === "year" && (
              <input
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 sm:w-24"
              />
            )}
          </div>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300 md:w-auto"
        >
          {isExporting ? "Exporting..." : "Export to PDF"}
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-500">Showing {period} range: {rangeLabel}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Revenue" value={`₱${totalRevenue.toLocaleString()}`} tone="emerald" />
        <StatCard title="Total Orders" value={totalOrders} tone="indigo" />
        <StatCard title="Active Customers" value={activeCustomers} tone="blue" />
      </div>

      <div className="bg-slate-950 text-slate-100 p-6 rounded-xl shadow mt-8 transition-colors">
        <h3 className="text-lg font-semibold mb-4">Revenue (by date)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            {/** Ensure axis/tick colors adapt to theme for readability */}
            {/* Use CSS variables so axis/tick colors follow the current theme reliably */}
            <XAxis dataKey="date" stroke={axisColor} tick={{ fill: axisColor }} />
            <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
            <Tooltip
              wrapperStyle={{ background: axisSurface || "#fff", borderRadius: 6 }}
              contentStyle={{ color: axisColor, background: axisSurface || "#fff" }}
            />

            <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-slate-950 text-slate-100 p-6 rounded-xl shadow">
          <h4 className="font-semibold mb-3">Quantity per Area / Tag</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2">Tag</th>
                <th className="pb-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {qtyByTag.map((row) => (
                <tr key={row.tag} className="odd:bg-slate-50 dark:odd:bg-gray-800">
                  <td className="py-2">{row.tag}</td>
                  <td className="py-2">{row.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-950 text-slate-100 p-6 rounded-xl shadow">
          <h4 className="font-semibold mb-3">Quantity by Mode (Pickup / Delivery)</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2">Mode</th>
                <th className="pb-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {qtyByMode.map((row) => (
                <tr key={row.mode} className="odd:bg-slate-50 dark:odd:bg-gray-800">
                  <td className="py-2">{row.mode}</td>
                  <td className="py-2">{row.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, tone = "indigo" }) {
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100",
  };

  return (
    <div className={`p-5 rounded-xl shadow flex flex-col ${toneMap[tone] || toneMap.indigo}`}>
      <p className="text-sm opacity-90">{title}</p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
    </div>
  );
}