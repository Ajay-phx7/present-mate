"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { Presentation } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        const res = await api.post("/auth/signup", { email, password, name });
        localStorage.setItem("user_id", res.data.user_id);
      } else {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("user_id", res.data.user_id);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-cream-50 font-sans p-6 overflow-hidden relative">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-glow" style={{animationDelay: '1s'}}></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-teal-50 p-8 z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-600 p-2.5 rounded-xl mb-4 shadow-sm">
            <Presentation className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-slate-800 tracking-tight">
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {isRegister ? "Join PresentMate and level-up your presentations." : "Sign in to access your slide dashboards."}
          </p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center font-medium border border-red-100">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white border-teal-100 focus-visible:ring-teal-500 rounded-xl h-12"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-teal-100 focus-visible:ring-teal-500 rounded-xl h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white border-teal-100 focus-visible:ring-teal-500 rounded-xl h-12"
            />
          </div>
          <Button type="submit" className="w-full h-12 mt-4 bg-teal-600 hover:bg-teal-700 hover:-translate-y-0.5 hover:shadow-lg transition-all rounded-xl font-bold text-white text-base">
            {isRegister ? "Sign Up" : "Log In"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-slate-500 border-t border-slate-100 pt-6">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-teal-600 hover:text-teal-700 hover:underline font-bold transition-colors"
          >
            {isRegister ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
