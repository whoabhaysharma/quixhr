"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen font-sans text-slate-900 flex flex-col bg-slate-50">

      {/* Header - Transparent on Dark */}
      <header className="px-6 py-5 flex justify-between items-center bg-slate-900 text-white sticky top-0 z-50 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">Q</div>
          <span className="text-lg font-bold tracking-tight">QuixHR</span>
        </div>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-md h-9 px-4 text-sm font-medium">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-md h-9 px-4 text-sm font-medium">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-md h-9 px-4 text-sm font-medium shadow-lg shadow-blue-500/20">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Dark Theme match */}
        <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900 text-white">
          <div className="container mx-auto px-6 text-center relative z-10">

            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-medium text-blue-300 bg-blue-900/30 rounded-full border border-blue-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              New: AI-Powered Leave Insights
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
              HR software that feels <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">like innovation.</span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Ditch the spreadsheets. Manage members, track leaves, and empower your team with a platform designed for the modern workplace.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button className="h-12 px-8 text-base bg-white text-slate-900 hover:bg-slate-100 rounded-md font-semibold transition-all shadow-xl hover:-translate-y-1">
                  Start 14-Day Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="h-12 px-8 text-base border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md bg-transparent">
                  View Live Demo
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500">No credit card required • Cancel anytime</p>
          </div>

          {/* Abstract Background Shapes (Same as Login) */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        </section>

        {/* Features Preview - White Section */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need, nothing you don't.</h2>
              <p className="text-slate-500 max-w-xl mx-auto">We focused on the core features that drive team productivity, removing the clutter of traditional HR software.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Team Management</h3>
                <p className="text-slate-500 leading-relaxed">
                  Centralize your employee database. Manage roles, departments, and access controls with a few clicks.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Leave Tracking</h3>
                <p className="text-slate-500 leading-relaxed">
                  Automate leave requests and approvals. Give your team visibility into who is away and when.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Insights</h3>
                <p className="text-slate-500 leading-relaxed">
                  Make data-driven decisions with real-time dashboards on workforce trends and availability.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-bold text-lg">QuixHR</span>
            </div>
            <p>© 2025 QuixHR Inc.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
