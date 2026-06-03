"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function endOfToday() {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function computeAmount(mode, quantity) {
  const qty = Number(quantity) || 0;
  return (mode === "DELIVERY" ? 35 : 30) * qty;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString();
}

function alternatingRowClass(index) {
  return index % 2 === 0 ? "bg-slate-950" : "bg-slate-900/80";
}

export default function HomePage() {
  const [orders, setOrders] = useState([]);
  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders", error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Edit / Delete UI state
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ customer: "", mode: "PICKUP", quantity: 1, status: "PENDING", mop: "Cash", deliveredBy: "" });

  // Inline driver editing state
  const [inlineEditingOrderId, setInlineEditingOrderId] = useState(null);
  const [inlineEditingDriver, setInlineEditingDriver] = useState("");

  const [deletingOrder, setDeletingOrder] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const openEdit = (order) => {
    setEditingOrder(order);
    setEditForm({
      customer: order.customer || "",
      mode: order.mode || "PICKUP",
      quantity: order.quantity ?? 1,
      status: order.status || "PENDING",
      mop: order.mop || order.MOP || order.modeOfPayment || "Cash",
      deliveredBy: order.deliveredBy || "",
    });
    setShowEdit(true);
  };

  const closeEdit = () => {
    setShowEdit(false);
    setEditingOrder(null);
  };

  const saveEdit = async () => {
    if (!editingOrder) return closeEdit();
    try {
      const updatedAmount = computeAmount(editForm.mode, editForm.quantity);
      const nextDeliveredBy = (editForm.mode || "PICKUP").toUpperCase() === "PICKUP"
        ? "PICKUP"
        : (editForm.deliveredBy || "");

      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingOrder.id, ...editForm, deliveredBy: nextDeliveredBy, amount: updatedAmount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to save order");
      }

      await loadOrders();
    } catch (err) {
      console.error(err);
      alert(`Failed to save order: ${err.message}`);
    }
    closeEdit();
  };

  const openDelete = (order) => {
    setDeletingOrder(order);
    setShowDelete(true);
  };

  const closeDelete = () => {
    setShowDelete(false);
    setDeletingOrder(null);
  };

  const confirmDelete = async () => {
    if (!deletingOrder) return closeDelete();
    try {
      await fetch("/api/orders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deletingOrder.id }) });
      await loadOrders();
    } catch (err) {
      console.error(err);
    }
    closeDelete();
  };

  const saveInlineDriver = async (orderId, driver, mode) => {
    const nextDriver = (mode || "PICKUP").toUpperCase() === "PICKUP" ? "PICKUP" : driver;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, deliveredBy: nextDriver }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to save driver");
      }

      await loadOrders();
    } catch (err) {
      console.error(err);
      alert(`Failed to save driver: ${err.message}`);
    }
    setInlineEditingOrderId(null);
    setInlineEditingDriver("");
  };

  const today = useMemo(() => {
    return { start: startOfToday(), end: endOfToday() };
  }, []);

  const todayAndPendingOrders = useMemo(() => {
    return orders.filter((order) => {
      const createdDate = new Date(order.createdAt || order.date || order?.date);
      const createdIsToday = !Number.isNaN(createdDate.getTime()) && isSameDay(createdDate, today.start);

      if (order.status === "COMPLETED") {
        return false;
      }

      return createdIsToday || order.status === "PENDING";
    });
  }, [orders, today]);

  const completedTodayOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status !== "COMPLETED" || !order.completedAt) {
        return false;
      }
      const completedDate = new Date(order.completedAt);
      return !Number.isNaN(completedDate.getTime()) && isSameDay(completedDate, today.start);
    });
  }, [orders, today]);

  const relevantTodayOrders = useMemo(() => {
    return orders.filter((order) => {
      const createdDate = new Date(order.createdAt || order.date || order?.date);
      const createdIsToday = !Number.isNaN(createdDate.getTime()) && isSameDay(createdDate, today.start);

      let completedIsToday = false;
      if (order.completedAt) {
        const completedDate = new Date(order.completedAt);
        completedIsToday = !Number.isNaN(completedDate.getTime()) && isSameDay(completedDate, today.start);
      }

      return createdIsToday || completedIsToday || order.status === "PENDING";
    });
  }, [orders, today]);

  const sortedOrders = useMemo(() => {
    return [...todayAndPendingOrders].sort((a, b) => {
      return new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime();
    });
  }, [todayAndPendingOrders]);

  const reportOrders = useMemo(() => {
    return [...completedTodayOrders].sort((a, b) => {
      const aTime = new Date(a.completedAt || a.createdAt || a.date).getTime();
      const bTime = new Date(b.completedAt || b.createdAt || b.date).getTime();
      const aPending = a.status === "PENDING" ? 1 : 0;
      const bPending = b.status === "PENDING" ? 1 : 0;

      if (aPending !== bPending) {
        return aPending - bPending;
      }

      return aTime - bTime;
    });
  }, [completedTodayOrders]);

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "PENDING"), [orders]);

  const pendingByArea = useMemo(() => {
    const map = {};
    pendingOrders.forEach((order) => {
      const tag = order.tag || "UNASSIGNED";
      const mode = (order.mode || "PICKUP").toUpperCase();
      const key = `${tag}||${mode}`;
      if (!map[key]) {
        map[key] = {
          tag,
          mode,
          count: 0,
          amount: 0,
        };
      }
      map[key].count += 1;
      map[key].amount += Number(order.amount) || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [pendingOrders]);

  // Add-order modal state (reuse OrdersPage add logic)
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedAreaTag, setSelectedAreaTag] = useState("All");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerInputFocused, setCustomerInputFocused] = useState(false);
  const [quantityInput, setQuantityInput] = useState(1);
  const [modeInput, setModeInput] = useState("PICKUP");
  const [addressInput, setAddressInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [amountInput, setAmountInput] = useState(30);

  const areaTagOptions = ["All", ...Array.from(new Set(customers.map((customer) => customer.tag).filter(Boolean))).sort()];

  const filteredCustomers = customers.filter((customer) => {
    const matchesTag = selectedAreaTag === "All" || customer.tag === selectedAreaTag;
    const matchesSearch = customerSearch.trim() === "" || customer.name?.toLowerCase().includes(customerSearch.trim().toLowerCase());
    return matchesTag && matchesSearch;
  });

  useEffect(() => {
    // load customers for add modal
    (async () => {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      const c = customers.find((c) => c.name === selectedCustomer);
      if (c) {
        setAddressInput(c.address || "");
        setTagInput(c.tag || "");
      }
    }
    setAmountInput(computeAmount(modeInput, quantityInput));
  }, [selectedCustomer, modeInput, quantityInput, customers]);

  const resetAddOrderModal = () => {
    setSelectedCustomer("");
    setSelectedAreaTag("All");
    setCustomerSearch("");
    setQuantityInput(1);
    setModeInput("PICKUP");
    setAddressInput("");
    setTagInput("");
    setAmountInput(30);
  };

  const addOrder = async () => {
    if (!selectedCustomer || !quantityInput) {
      alert("Please select customer and quantity");
      return;
    }

    const newOrder = {
      customer: selectedCustomer,
      address: addressInput,
      quantity: Number(quantityInput),
      amount: computeAmount(modeInput, quantityInput),
      mode: modeInput,
      mop: "Cash",
      tag: tagInput,
      deliveredBy: modeInput === "PICKUP" ? "PICKUP" : "",
      status: "PENDING",
      date: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      const data = await res.json();
      if (res.ok) {
        // refresh orders list
        await loadOrders();
        // reset
        resetAddOrderModal();
        setShowAddModal(false);
      } else {
        alert(`Error: ${data.error || "Failed to add order"}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to add order: ${err.message}`);
    }
  };

  const summary = useMemo(() => {
    const totalToday = reportOrders.length;
    const pendingTotal = pendingOrders.length;
    const pendingToday = relevantTodayOrders.filter((order) => order.status === "PENDING").length;
    const revenueTodayAmount = reportOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    const gcashAmount = reportOrders
      .filter((order) => order.mop === "Gcash" || order.MOP === "Gcash")
      .reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    const cashAmount = reportOrders
      .filter((order) => order.mop === "Cash" || order.MOP === "Cash")
      .reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    const uniquePendingAreas = new Set(pendingOrders.map((order) => order.tag || "UNASSIGNED")).size;

    return {
      totalToday,
      pendingTotal,
      pendingToday,
      revenueTodayAmount,
      gcashAmount,
      cashAmount,
      uniquePendingAreas,
    };
  }, [reportOrders, relevantTodayOrders, pendingOrders]);

  const driverTotals = useMemo(() => {
    const map = {};

    relevantTodayOrders.forEach((order) => {
      const driver = (order.mode || "").toUpperCase() === "PICKUP"
        ? "PICKUP"
        : (order.deliveredBy || "Unassigned");

      if (!map[driver]) {
        map[driver] = {
          driver,
          orders: 0,
          quantity: 0,
          amount: 0,
        };
      }

      map[driver].orders += 1;
      map[driver].quantity += Number(order.quantity) || 0;
      map[driver].amount += Number(order.amount) || 0;
    });

    return Object.values(map).sort((a, b) => b.amount - a.amount || b.quantity - a.quantity || a.driver.localeCompare(b.driver));
  }, [relevantTodayOrders]);

  const handleExportToPdf = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 36;
      const todayLabel = new Date(today.start).toLocaleDateString();

      doc.setFontSize(18);
      doc.text("Water Store App - Daily Report", margin, 40);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 58);
      doc.text(`Date: ${todayLabel}`, margin, 74);

      const reportRows = reportOrders.length
        ? reportOrders.map((order) => [
            order.customer || "—",
            order.tag || "UNASSIGNED",
            order.mode || "PICKUP",
            order.mop || order.MOP || order.modeOfPayment || "—",
            String(order.quantity ?? 0),
            `₱${Number(order.amount || 0).toLocaleString()}`,
            formatDateTime(order.createdAt || order.date),
            formatDateTime(order.completedAt),
            order.status || "COMPLETED",
          ])
        : [["—", "—", "—", "—", "—", "—", "—", "—", "—"]];

      autoTable(doc, {
        head: [["Customer", "Tag", "Mode", "MOP", "Qty", "Amount", "Date Created", "Date Completed", "Status"]],
        body: reportRows,
        startY: 92,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
      });

      let y = doc.lastAutoTable.finalY + 18;
      doc.setFontSize(12);
      doc.text("Data Summary", margin, y);
      y += 4;

      autoTable(doc, {
        head: [["Metric", "Value"]],
        body: [
          ["Total Completed Today", String(summary.totalToday)],
          ["Pending Overall (For next day)", String(summary.pendingTotal)],
          ["Total Cash", `₱${summary.cashAmount.toLocaleString()}`],
          ["Total Gcash", `₱${summary.gcashAmount.toLocaleString()}`],
        ],
        startY: y,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable.finalY + 18;
      doc.setFontSize(12);
      doc.text("Amount and Quantity Total per Driver", margin, y);
      y += 4;

      autoTable(doc, {
        head: [["Driver", "Orders", "Total Qty", "Total Amount"]],
        body: driverTotals.map((row) => [row.driver, String(row.orders), String(row.quantity), `₱${row.amount.toLocaleString()}`]),
        startY: y,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
      });

      doc.save(`water-store-daily-report-${todayLabel.replaceAll("/", "-")}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF", error);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="text-slate-100">


      <section className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pending Orders</h1>
              <p className="text-sm text-slate-400">All pending orders plus orders created today. Completed orders today are shown separately below.</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              Sorted by created date (oldest first)
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-lg">
            <div className="h-[520px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Customer</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Tag</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Mode</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">MOP</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Qty</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Amount</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Status</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Created</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950">
                  {sortedOrders.map((order, index) => (
                    <tr key={`${order.id || order.sk || order.customer}-${index}`} className={alternatingRowClass(index)}>
                      <td className="px-3 py-2 text-slate-100">{order.customer || "—"}</td>
                      <td className="px-3 py-2 text-slate-200">{order.tag || "UNASSIGNED"}</td>
                      <td className="px-3 py-2 text-slate-200">{order.mode || "PICKUP"}</td>
                      <td className="px-3 py-2 text-slate-200">{order.mop || order.MOP || order.modeOfPayment || "—"}</td>
                      <td className="px-3 py-2">{order.quantity ?? "—"}</td>
                      <td className="px-3 py-2">₱{Number(order.amount || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[0.65rem] font-semibold ${order.status === "PENDING" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                          {order.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{new Date(order.createdAt || order.date).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(order)} className="rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500">Edit</button>
                          <button onClick={() => openDelete(order)} className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedOrders.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
                        No orders found for today or no pending orders are available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-lg">
            <div className="px-5 py-4">
              <div>
                <h1 className="text-3xl font-bold">Completed Orders Today</h1>
                <p className="text-sm text-slate-400">Completed orders for today, ordered from earliest to latest.</p>
              </div>
            </div>
            <div className="h-[520px] overflow-y-auto overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Customer</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Tag</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Mode</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">MOP</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Qty</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Amount</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Date Created</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Date Completed</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Driver</th>
                    <th className="sticky top-0 z-10 px-3 py-2 bg-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950">
                  {reportOrders.map((order, index) => (
                    <tr key={`${order.id || order.sk || order.customer}-${index}`} className={alternatingRowClass(index)}>
                      <td className="px-3 py-2 text-slate-100">{order.customer || "—"}</td>
                      <td className="px-3 py-2 text-slate-200">{order.tag || "UNASSIGNED"}</td>
                      <td className="px-3 py-2 text-slate-200">{order.mode || "PICKUP"}</td>
                      <td className="px-3 py-2 text-slate-200">{order.mop || order.MOP || order.modeOfPayment || "—"}</td>
                      <td className="px-3 py-2">{order.quantity ?? "—"}</td>
                      <td className="px-3 py-2">₱{Number(order.amount || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-slate-400">{formatDateTime(order.createdAt || order.date)}</td>
                      <td className="px-3 py-2 text-slate-400">{formatDateTime(order.completedAt)}</td>
                      <td className="px-3 py-2">
                        {(order.mode || "PICKUP").toUpperCase() === "PICKUP" ? (
                          <span className="rounded bg-slate-800 px-2 py-1 text-slate-100">PICKUP</span>
                        ) : (
                          <select
                            className="rounded bg-slate-800 px-2 py-1 text-slate-100"
                            value={order.deliveredBy || ""}
                            onChange={async (e) => {
                              await saveInlineDriver(order.id, e.target.value, order.mode);
                            }}
                          >
                            <option value="">-- Select Driver --</option>
                            <option>Driver1</option>
                            <option>Driver2</option>
                            <option>Driver3</option>
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[0.65rem] font-semibold ${order.status === "PENDING" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                          {order.status || "COMPLETED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reportOrders.length === 0 && (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-slate-500">
                        No completed orders found for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center mb-2">
            <button onClick={() => setShowAddModal(true)} className="w-full h-14 rounded-2xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              + Add New Order
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-sm flex flex-col h-[520px]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Pending Orders by Area / Batch</h2>
                <p className="text-sm text-slate-400">Breakdown of outstanding orders by tag and pickup/delivery batch.</p>
              </div>
              <div className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300 whitespace-nowrap">
                {pendingByArea.length} unique groups
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-lg flex-1 flex">
              <div className="flex-1 overflow-y-auto overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Area / Tag</th>
                      <th className="px-4 py-3">Batch (Mode)</th>
                      <th className="px-4 py-3">Pending Orders</th>
                      <th className="px-4 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950">
                    {pendingByArea.map((row, index) => (
                      <tr key={`${row.tag}-${row.mode}-${index}`} className={alternatingRowClass(index)}>
                        <td className="px-4 py-3 text-slate-100">{row.tag}</td>
                        <td className="px-4 py-3 text-slate-200">{row.mode}</td>
                        <td className="px-4 py-3">{row.count}</td>
                        <td className="px-4 py-3">₱{row.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {pendingByArea.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                          No pending orders exist right now.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Summary</p>
                <p className="mt-1 text-sm text-slate-400">Generate a PDF export for the daily report.</p>
              </div>
              <button
                onClick={handleExportToPdf}
                disabled={isExporting}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isExporting ? "Exporting..." : "Export to PDF"}
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Metric</th>
                    <th className="px-4 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950">
                  <tr className={alternatingRowClass(0)}>
                    <td className="px-4 py-3 text-slate-100">Total Completed Today</td>
                    <td className="px-4 py-3">{summary.totalToday}</td>
                  </tr>
                  <tr className={alternatingRowClass(1)}>
                    <td className="px-4 py-3 text-slate-100">Pending Overall (For next day)</td>
                    <td className="px-4 py-3">{summary.pendingTotal}</td>
                  </tr>
                  <tr className={alternatingRowClass(2)}>
                    <td className="px-4 py-3 text-slate-100">Total Cash</td>
                    <td className="px-4 py-3">₱{summary.cashAmount.toLocaleString()}</td>
                  </tr>
                  <tr className={alternatingRowClass(3)}>
                    <td className="px-4 py-3 text-slate-100">Total Gcash</td>
                    <td className="px-4 py-3">₱{summary.gcashAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400 mb-3">Amount and Quantity Total per Driver</p>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="px-4 py-2">Driver</th>
                      <th className="px-4 py-2">Orders</th>
                      <th className="px-4 py-2">Total Qty</th>
                      <th className="px-4 py-2">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {driverTotals.map((row, index) => (
                      <tr key={row.driver} className={alternatingRowClass(index)}>
                        <td className="px-4 py-2 text-slate-100">{row.driver}</td>
                        <td className="px-4 py-2">{row.orders}</td>
                        <td className="px-4 py-2">{row.quantity}</td>
                        <td className="px-4 py-2">₱{row.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {driverTotals.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-center text-slate-500 text-xs">
                          No drivers assigned yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6">
            <h3 className="text-lg font-semibold">Edit Order</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-300">Customer</label>
              <input value={editForm.customer} onChange={(e) => setEditForm(s => ({ ...s, customer: e.target.value }))} className="w-full rounded-md bg-slate-800 px-3 py-2 text-white" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300">Mode</label>
                  <select value={editForm.mode} onChange={(e) => setEditForm(s => ({ ...s, mode: e.target.value }))} className="mt-1 w-full rounded-md bg-slate-800 px-3 py-2 text-white">
                    <option>PICKUP</option>
                    <option>DELIVERY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300">MOP</label>
                  <select value={editForm.mop} onChange={(e) => setEditForm(s => ({ ...s, mop: e.target.value }))} className="mt-1 w-full rounded-md bg-slate-800 px-3 py-2 text-white">
                    <option>Cash</option>
                    <option>Gcash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300">Qty</label>
                  <input type="number" value={editForm.quantity} min={1} max={10} onChange={(e) => setEditForm(s => ({ ...s, quantity: Number(e.target.value) }))} className="mt-1 w-full rounded-md bg-slate-800 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm(s => ({ ...s, status: e.target.value }))} className="mt-1 w-full rounded-md bg-slate-800 px-3 py-2 text-white">
                    <option>PENDING</option>
                    <option>COMPLETED</option>
                  </select>
                </div>
              </div>

              {editForm.status === "COMPLETED" && (
                editForm.mode === "PICKUP" ? (
                  <div>
                    <label className="block text-sm text-slate-300">Delivered By</label>
                    <p className="mt-1 rounded-md bg-slate-800 px-3 py-2 text-slate-200">PICKUP</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-slate-300">Delivered By</label>
                    <select value={editForm.deliveredBy} onChange={(e) => setEditForm(s => ({ ...s, deliveredBy: e.target.value }))} className="mt-1 w-full rounded-md bg-slate-800 px-3 py-2 text-white">
                      <option value="">-- Select Driver --</option>
                      <option>Driver1</option>
                      <option>Driver2</option>
                      <option>Driver3</option>
                    </select>
                  </div>
                )
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={closeEdit} className="rounded-md bg-slate-700 px-4 py-2 text-sm">Cancel</button>
              <button onClick={saveEdit} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Order modal (home) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-slate-900 dark:bg-gray-900 dark:text-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">New Order</h2>
              <button onClick={() => { resetAddOrderModal(); setShowAddModal(false); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Area Tag</label>
                <select
                  value={selectedAreaTag}
                  onChange={(e) => {
                    setSelectedAreaTag(e.target.value);
                    setSelectedCustomer("");
                    setCustomerSearch("");
                    setAddressInput("");
                    setTagInput("");
                  }}
                  className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700"
                >
                  {areaTagOptions.map((tagOption) => (
                    <option key={tagOption} value={tagOption}>{tagOption}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onFocus={() => setCustomerInputFocused(true)}
                    onBlur={() => setCustomerInputFocused(false)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomer("");
                      setAddressInput("");
                      setTagInput("");
                    }}
                    placeholder="Type to search customer name"
                    className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700"
                  />
                  {customerInputFocused && customerSearch.trim() === "" && !selectedCustomer && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      {filteredCustomers.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-300">No matching customers found.</p>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.customerId || customer.name}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(customer.name);
                              setCustomerSearch(customer.name);
                              setAddressInput(customer.address || "");
                              setTagInput(customer.tag || "");
                            }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-gray-700"
                          >
                            {customer.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" placeholder="Qty" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" min="1" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mode</label>
                <select value={modeInput} onChange={(e) => setModeInput(e.target.value)} className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700">
                  <option value="PICKUP">Pickup (₱30)</option>
                  <option value="DELIVERY">Delivery (₱35)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input type="text" value={addressInput} readOnly className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tag</label>
                <input type="text" value={tagInput} readOnly className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input type="text" value={`₱${computeAmount(modeInput, quantityInput)}`} readOnly className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">MOP</label>
                <select value={"Cash"} onChange={() => {}} className="w-full border p-2 rounded bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-700">
                  <option>Cash</option>
                  <option>Gcash</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { resetAddOrderModal(); setShowAddModal(false); }} className="bg-gray-500 text-white px-4 py-2 rounded font-medium hover:bg-gray-600">Cancel</button>
              <button onClick={addOrder} className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">Add Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6">
            <h3 className="text-lg font-semibold">Confirm delete</h3>
            <p className="mt-3 text-sm text-slate-300">Are you sure you want to delete this order? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={closeDelete} className="rounded-md bg-slate-700 px-4 py-2 text-sm">Cancel</button>
              <button onClick={confirmDelete} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ label, value, tone, compact }) {
  const toneClasses = {
    blue: "bg-slate-900 text-sky-300",
    amber: "bg-slate-900 text-amber-300",
    violet: "bg-slate-900 text-violet-300",
    emerald: "bg-slate-900 text-emerald-300",
    sky: "bg-slate-900 text-sky-300",
  };

  return (
    <div className={`rounded-3xl border border-slate-800 shadow-sm ${toneClasses[tone] || toneClasses.blue} ${compact ? "p-4" : "p-5"}`}>
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`${compact ? "mt-2 text-lg" : "mt-3 text-3xl"} font-semibold break-words`}>{value}</p>
    </div>
  );
}
