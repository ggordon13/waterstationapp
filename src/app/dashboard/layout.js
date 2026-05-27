import Link from "next/link";
import SidebarControls from "@/components/SidebarControls";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">Water Station</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Operations Dashboard</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-300">
            <Link href="/dashboard/home" className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 transition hover:bg-slate-800 hover:text-white">
              Home
            </Link>
            <Link href="/dashboard" className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 transition hover:bg-slate-800 hover:text-white">
              Dashboard
            </Link>
            <Link href="/dashboard/orders" className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 transition hover:bg-slate-800 hover:text-white">
              Orders
            </Link>
            <Link href="/dashboard/customers" className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 transition hover:bg-slate-800 hover:text-white">
              Customers
            </Link>
          </nav>

          <div className="flex items-center">
            <SidebarControls />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-8xl px-4 py-8">{children}</main>
    </div>
  );
}