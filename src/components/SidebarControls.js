"use client";

export default function SidebarControls() {

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="space-y-3">
      <button
        onClick={logout}
        className="inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
      >
        Logout
      </button>
    </div>
  );
}