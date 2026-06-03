"use client";

import { useEffect, useState } from "react";

function alternatingRowClass(index) {
  return index % 2 === 0 ? "bg-slate-50 dark:bg-slate-950" : "bg-white dark:bg-slate-900/80";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedAreaTag, setSelectedAreaTag] = useState("All");
  const [areaTagOptions, setAreaTagOptions] = useState(["All"]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const formatDateOnly = (value) => {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleDateString();
    } catch (err) {
      return "—";
    }
  };

  const getDaysSince = (value) => {
    if (!value) return "No completed order";

    try {
      const lastOrderDate = new Date(value);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    } catch (err) {
      return "—";
    }
  };

  const loadCustomers = async () => {
    try {
      const [customersRes, ordersRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/orders"),
      ]);

      const customerData = await customersRes.json();
      const ordersData = await ordersRes.json();

      const normalizedCustomers = Array.isArray(customerData) ? customerData : [];
      const normalizedOrders = Array.isArray(ordersData) ? ordersData : [];

      const enrichedCustomers = normalizedCustomers.map((customer) => {
        const normalizedCustomerName = (customer.name || "").trim().toLowerCase();

        const completedOrders = normalizedOrders
          .filter((order) => order.status === "COMPLETED" && order.completedAt)
          .filter((order) => {
            const normalizedOrderCustomer = (order.customer || "").trim().toLowerCase();
            return normalizedOrderCustomer === normalizedCustomerName;
          })
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        return {
          ...customer,
          lastOrderDate: completedOrders[0]?.completedAt || null,
        };
      });

      setCustomers(enrichedCustomers);
      setAreaTagOptions([
        "All",
        ...Array.from(new Set(normalizedCustomers.map((customer) => customer.tag).filter(Boolean))).sort(),
      ]);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const clearForm = () => {
    setNewName("");
    setNewAddress("");
    setNewTag("");
  };

  const addCustomer = async () => {
    if (!newName || !newAddress || !newTag) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, address: newAddress, tag: newTag }),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "Failed to add customer");
      }

      await loadCustomers();
      clearForm();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to add customer");
    }
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setNewName(customer.name || "");
    setNewAddress(customer.address || "");
    setNewTag(customer.tag || "");
    setShowEditModal(true);
  };

  const updateCustomer = async () => {
    if (!editingCustomer?.customerId) return;
    if (!newName || !newAddress || !newTag) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: editingCustomer.customerId,
          name: newName,
          address: newAddress,
          tag: newTag,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to update customer");

      await loadCustomers();
      setShowEditModal(false);
      setEditingCustomer(null);
      clearForm();
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to update customer");
    }
  };

  const openDelete = (customer) => {
    setDeletingCustomer(customer);
    setShowDeleteModal(true);
  };

  const deleteCustomer = async () => {
    if (!deletingCustomer?.customerId) return;

    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: deletingCustomer.customerId }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to delete customer");

      await loadCustomers();
      setShowDeleteModal(false);
      setDeletingCustomer(null);
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to delete customer");
    }
  };

  const filteredCustomers = selectedAreaTag === "All"
    ? customers
    : customers.filter((customer) => customer.tag === selectedAreaTag);

  return (
    <div className="px-1 py-4 text-slate-900 dark:text-white sm:px-2 lg:px-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <label htmlFor="area-tag-filter" className="text-sm font-medium text-slate-700 dark:text-slate-200">Area Tag</label>
            <select
              id="area-tag-filter"
              value={selectedAreaTag}
              onChange={(event) => setSelectedAreaTag(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {areaTagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
        >
          Add New Customer Data
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="min-w-[640px] w-full text-slate-900 dark:text-white">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Name</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Address</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Area Tag</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Last Order</th>
              <th className="p-3 text-right text-sm font-semibold text-slate-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => (
              <tr key={c.customerId || c.name} className={`${alternatingRowClass(index)} border-b border-gray-100 dark:border-gray-800`}>
                <td className="p-3 text-sm">{c.name}</td>
                <td className="p-3 text-sm">{c.address}</td>
                <td className="p-3 text-sm">{c.tag}</td>
                <td className="p-3 text-sm text-slate-700 dark:text-slate-200">
                  <div className="flex flex-col gap-0.5">
                    <span>{formatDateOnly(c.lastOrderDate)}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{getDaysSince(c.lastOrderDate)}</span>
                  </div>
                </td>
                <td className="p-3 text-right text-sm">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-md bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-400"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => openDelete(c)}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-slate-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Customer</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">×</button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 text-slate-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Enter name" />

              <label className="block text-sm font-medium">Address</label>
              <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 text-slate-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Enter address" />

              <label className="block text-sm font-medium">Area Tag</label>
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 text-slate-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Enter area tag" />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { clearForm(); setShowModal(false); }} className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={addCustomer} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Add Customer</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-slate-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Update Customer</h2>
              <button onClick={() => { setShowEditModal(false); setEditingCustomer(null); clearForm(); }} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">×</button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 text-slate-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Enter name" />

              <label className="block text-sm font-medium">Address</label>
              <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 text-slate-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Enter address" />

              <label className="block text-sm font-medium">Area Tag</label>
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 text-slate-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Enter area tag" />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowEditModal(false); setEditingCustomer(null); clearForm(); }} className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={updateCustomer} className="rounded-md bg-amber-500 px-4 py-2 text-white hover:bg-amber-400">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-slate-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-semibold">Delete Customer</h2>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">Are you sure you want to delete this customer? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowDeleteModal(false); setDeletingCustomer(null); }} className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={deleteCustomer} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}