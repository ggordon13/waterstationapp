"use client";

import { useEffect, useState } from "react";

export default function CustomersPage() {

  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then(res => res.json())
      .then(data => setCustomers(data));
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

    const newRecord = { name: newName, address: newAddress, tag: newTag };

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "Failed to add customer");
      }

      const created = payload?.customer || newRecord;

      setCustomers((prev) => [...prev, created]);
      clearForm();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to add customer");
    }
  };

  return (
    <div className="p-6 text-slate-900 dark:text-white">

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Customer Data
        </button>
      </div>

      <table className="w-full bg-white text-slate-900 dark:bg-gray-900 dark:text-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">

        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Name</th>
            <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Address</th>
            <th className="p-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-300">Area Tag</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((c, index) => (
            <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
              <td className="p-3 text-sm text-slate-900 dark:text-white">{c.name}</td>
              <td className="p-3 text-sm text-slate-900 dark:text-white">{c.address}</td>
              <td className="p-3 text-sm text-slate-900 dark:text-white">{c.tag}</td>
            </tr>
          ))}
        </tbody>

      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white text-slate-900 dark:bg-gray-900 dark:text-white rounded-xl w-full max-w-md p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Customer</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">×</button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-slate-900 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="Enter name"
              />

              <label className="block text-sm font-medium">Address</label>
              <input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-slate-900 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="Enter address"
              />

              <label className="block text-sm font-medium">Area Tag</label>
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-slate-900 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                placeholder="Enter area tag"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  clearForm();
                  setShowModal(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addCustomer}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}