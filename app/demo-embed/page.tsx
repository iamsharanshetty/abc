// app/demo-embed/page.tsx - PROFESSIONAL VERSION
// This version embeds the chat widget directly (no iframe black screen)

"use client";

import { ChatWidget } from "@/components/chat/ChatWidget";

export default function DemoEmbedPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 border-t-8 border-blue-600">
      {/* Mock Customer Website Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="font-bold text-2xl tracking-tight">Acme Corp</div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-blue-600">
            Products
          </a>
          <a href="#" className="hover:text-blue-600">
            Solutions
          </a>
          <a href="#" className="hover:text-blue-600">
            Pricing
          </a>
          <a href="#" className="hover:text-blue-600">
            Contact
          </a>
        </nav>
        <div className="flex gap-4">
          <button className="px-5 py-2 rounded-full border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
            Login
          </button>
          <button className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
            Get Started
          </button>
        </div>
      </header>

      {/* Mock Hero */}
      <div className="bg-slate-50 py-24">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold mb-6">
              NEW FEATURE
            </div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight text-slate-900">
              Automate your workflow <br />
              <span className="text-blue-600">Focus on growth.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Acme Corp helps you streamline your business processes with our
              cutting-edge capabilities. Stop wasting time on manual tasks.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">
                Start Free Trial
              </button>
              <button className="px-8 py-4 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <div className="space-y-4">
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-32 bg-slate-100 rounded w-full"></div>
              <div className="flex gap-4">
                <div className="h-10 bg-blue-100 rounded w-1/3"></div>
                <div className="h-10 bg-slate-100 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Why Choose Acme Corp?
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to scale your business efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
            <p className="text-slate-600">
              Automate tasks in seconds, not hours
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Secure by Default</h3>
            <p className="text-slate-600">Enterprise-grade security built-in</p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Real-time Analytics</h3>
            <p className="text-slate-600">
              Track performance with live insights
            </p>
          </div>
        </div>
      </div>

      {/* ✅ CHAT WIDGET - Direct component (no iframe!) */}
      {/* This renders the chat widget directly on the page */}
      {/* No black screen, no iframe issues, fully integrated */}
      <ChatWidget
        agentId="0bd7d7df-35d2-4c33-b2af-f5c4a01f7aaa"
        primaryColor="#2563eb"
        title="Acme Support"
      />
    </div>
  );
}
