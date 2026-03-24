"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Presentation, Plus, LogOut, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [presentations, setPresentations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPresentations = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        router.push("/login");
        return;
      }
      try {
        const res = await api.get(`/presentations/?user_id=${userId}`);
        setPresentations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPresentations();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Presentation className="w-6 h-6" />
          <span>PresentMate Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/upload">
            <Button className="flex items-center gap-2"><Plus className="w-4 h-4" /> Upload</Button>
          </Link>
          <Button variant="ghost" onClick={handleLogout} className="text-slate-500">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Your Presentations</h1>
          <p className="text-slate-500">Manage and review your AI-processed slides.</p>
        </div>

        {loading ? (
          <p>Loading presentations...</p>
        ) : presentations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <Presentation className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No presentations yet</h3>
            <p className="text-slate-500 mb-4">Upload your first PPT or PDF to let AI analyze it.</p>
            <Link href="/upload">
              <Button>Upload Presentation</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((p) => (
              <div key={p._id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex-1 mb-4">
                  <h3 className="font-semibold text-lg text-slate-800 mb-1 truncate" title={p.title}>{p.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="bg-slate-100 px-2 py-1 rounded">{p.file_type.includes("pdf") ? "PDF" : "PPTX"}</span>
                    <span>•</span>
                    <span>{new Date(p.upload_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm">
                    Status: <span className={p.processing_status === "ready" ? "text-green-600 font-medium" : "text-amber-600 font-medium capitalize"}>{p.processing_status}</span>
                  </div>
                </div>
                <Link href={`/presentation/${p._id}`}>
                  <Button variant="outline" className="w-full flex items-center justify-between">
                    View Details <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
