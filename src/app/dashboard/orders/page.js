"use client";

import { useState, useEffect } from "react";

function alternatingRowClass(index) {
  return index % 2 === 0 ? "bg-slate-50 dark:bg-slate-950" : "bg-white dark:bg-slate-900/80";
}

function computeAmount(mode, quantity) {
  const qty = Number(quantity) || 0;
  return (mode === "DELIVERY" ? 35 : 30) * qty;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ customer: "", mode: "PICKUP", quantity: 1, status: "PENDING", mop: "Cash" });
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [quantity, setQuantity] = useState("");
  const [mode, setMode] = useState("PICKUP");
  const [address, setAddress] = useState("");
  const [tag, setTag] = useState("");
  const [amount, setAmount] = useState(0);

  // Fetch orders and customers on mount
  const loadOrders = async () => {
    try {
      const [ordersData, customersData] = await Promise.all([
        fetch("/api/orders").then(res => res.json()),
        fetch("/api/customers").then(res => res.json())
      ]);
      setOrders(ordersData || []);
      setCustomers(customersData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Auto-populate address, tag, and calculate amount when customer or mode changes
  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c.name === selectedCustomer);
      if (customer) {
        setAddress(customer.address || "");
        setTag(customer.tag || "");
      }
    }
    
    setAmount(computeAmount(mode, quantity));
  }, [selectedCustomer, mode, quantity, customers]);

  const addOrder = async () => {
    if (!selectedCustomer || !quantity) {
      alert("Please select customer and quantity");
      return;
    }

    const newOrder = {
      customer: selectedCustomer,
      address,
      quantity: Number(quantity),
      amount: amount * Number(quantity),
      mode,
      mop: "Cash",
      tag,
      status: "PENDING",
      date: new Date().toISOString(),
    };

    try {
      console.log("Sending order:", newOrder);
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      const data = await res.json();
      console.log("API Response:", res.status, data);

      if (res.ok) {
        alert("Order added successfully!");
        
        // Refresh orders list
        const updatedOrders = await fetch("/api/orders").then(r => r.json());
        setOrders(updatedOrders);
        
        // Reset form and close modal
        setSelectedCustomer("");
        setQuantity("");
        setMode("PICKUP");
        setAddress("");
        setTag("");
        setAmount(30);
        setShowModal(false);
      } else {
        alert(`Error: ${data.error || "Failed to add order"}`);
      }
    } catch (err) {
      console.error("Error adding order:", err);
      alert(`Failed to add order: ${err.message}`);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Reset form
    setSelectedCustomer("");
    setQuantity("");
    setMode("PICKUP");
    setAddress("");
    setTag("");
    setAmount(30);
  };

  // Edit / Delete handlers
  const openEdit = (order) => {
    setEditingOrder(order);
    setEditForm({
      customer: order.customer || "",
      mode: order.mode || "PICKUP",
      quantity: order.quantity ?? 1,
      status: order.status || "PENDING",
      mop: order.mop || order.MOP || order.modeOfPayment || "Cash",
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
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOrder.id, ...editForm, amount: updatedAmount }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || 'Failed to save order');
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
      await fetch('/api/orders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deletingOrder.id }) });
      await loadOrders();
    } catch (err) {
      console.error(err);
    }
    closeDelete();
  };

  const deleteOrder = (id) => {
    setOrders(orders.filter((order) => order.id !== id));
  };

  const toggleStatus = (id) => {
    setOrders(
      orders.map((order) =>
        order.id === id
          ? {
              ...order,
              status: order.status === "PENDING" ? "COMPLETED" : "PENDING",
            }
          : order
      )
    );
  };

  return (
    <div className="px-1 py-4 text-slate-900 dark:text-white sm:px-2 lg:px-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
        <button
          onClick={() => setShowModal(true)}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:w-auto"
        >
          + Add New Order
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 text-slate-900 shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">New Order</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full border p-2 rounded 
bg-white text-black 
dark:bg-gray-800 dark:text-white 
dark:border-gray-700">
                  <option value="">-- Select Customer --</option>
                  {customers.map((c, idx) => (
                    <option key={idx} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border p-2 rounded 
bg-white text-black 
dark:bg-gray-800 dark:text-white 
dark:border-gray-700"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full border p-2 rounded 
bg-white text-black 
dark:bg-gray-800 dark:text-white 
dark:border-gray-700"
                >
                  <option value="PICKUP">Pickup (₱30)</option>
                  <option value="DELIVERY">Delivery (₱35)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  readOnly
                  className="w-full border p-2 rounded 
bg-white text-black 
dark:bg-gray-800 dark:text-white 
dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tag</label>
                <input
                  type="text"
                  value={tag}
                  readOnly
                  className="w-full border p-2 rounded 
bg-white text-black 
dark:bg-gray-800 dark:text-white 
dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="text"
                  value={`₱${(amount * (quantity || 1)).toFixed(2)}`}
                  readOnly
                  className="w-full border p-2 rounded 
bg-white text-black 
dark:bg-gray-800 dark:text-white 
dark:border-gray-700"
                />
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
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded font-medium hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={addOrder}
                className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700"
              >
                Add Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="min-w-[980px] w-full overflow-hidden rounded-lg">
        <thead>
          <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <th className="p-3 text-left">Customer</th>
            <th className="p-3 text-left">Address</th>
            <th className="p-3 text-left">Qty</th>
            <th className="p-3 text-left">Mode</th>
            <th className="p-3 text-left">MOP</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Tag</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Date Completed</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order, index) => (
            <tr key={index} className={`${alternatingRowClass(index)} border-b dark:border-gray-800`}>
              <td className="p-3">{order.customer}</td>
              <td className="p-3">{order.address}</td>
              <td className="p-3">{order.quantity}</td>
              <td className="p-3">{order.mode}</td>
              <td className="p-3">{order.mop || order.MOP || order.modeOfPayment || "—"}</td>
              <td className="p-3">₱{order.amount}</td>
              <td className="p-3">{order.tag}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    order.status === "PENDING"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-green-200 text-green-800"
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="p-3">{order.completedAt ? new Date(order.completedAt).toLocaleString() : "—"}</td>
              <td className="p-3">{new Date(order.date).toLocaleString()}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openEdit(order)} className="rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500">Edit</button>
                  <button onClick={() => openDelete(order)} className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Order</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-700 dark:text-slate-300">Customer</label>
              <input value={editForm.customer} onChange={(e) => setEditForm(s => ({ ...s, customer: e.target.value }))} className="w-full rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-white" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300">Mode</label>
                  <select value={editForm.mode} onChange={(e) => setEditForm(s => ({ ...s, mode: e.target.value }))} className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-white">
                    <option>PICKUP</option>
                    <option>DELIVERY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300">MOP</label>
                  <select value={editForm.mop} onChange={(e) => setEditForm(s => ({ ...s, mop: e.target.value }))} className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-white">
                    <option>Cash</option>
                    <option>Gcash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300">Qty</label>
                  <input type="number" value={editForm.quantity} min={1} onChange={(e) => setEditForm(s => ({ ...s, quantity: Number(e.target.value) }))} className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 dark:text-slate-300">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm(s => ({ ...s, status: e.target.value }))} className="mt-1 w-full rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-white">
                    <option>PENDING</option>
                    <option>COMPLETED</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={closeEdit} className="rounded-md bg-gray-300 px-4 py-2">Cancel</button>
              <button onClick={saveEdit} className="rounded-md bg-emerald-600 px-4 py-2 text-white">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm delete</h3>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">Are you sure you want to delete this order? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={closeDelete} className="rounded-md bg-gray-300 px-4 py-2">Cancel</button>
              <button onClick={confirmDelete} className="rounded-md bg-red-600 px-4 py-2 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}