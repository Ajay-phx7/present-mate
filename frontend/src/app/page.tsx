import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic, Presentation, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Presentation className="w-6 h-6" />
          <span>PresentMate</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/login?tab=register">
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl text-slate-900">
            Your Real-time AI <br className="hidden sm:inline" /> Presentation Assistant
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Upload your slides, get AI-generated speaking points, and receive context-aware answers to audience questions—live while you present.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">Get Started Free</Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 mt-24 text-left">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <FileText className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Automated Summaries</h3>
              <p className="text-slate-600">Instantly extract key talking points and likely audience questions from your PPT/PDF slides.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <Presentation className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Presenter Overlay</h3>
              <p className="text-slate-600">A minimal Chrome extension overlay providing confidence cues right where you need them.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <Mic className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Live Q&A Support</h3>
              <p className="text-slate-600">Listen to audience questions in real-time and magically see context-based hint cards matched to your slides.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
