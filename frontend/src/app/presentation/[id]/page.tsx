"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Presentation, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function PresentationDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sessionStarting, setSessionStarting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/presentations/${id}`);
        setData(res.data);
        
        // If still processing, poll every 3 seconds
        if (res.data.processing_status !== "ready" && res.data.processing_status !== "failed") {
            setLoading(false);
            interval = setTimeout(fetchDetails, 3000) as unknown as NodeJS.Timeout;
        } else {
            setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchDetails();
    
    return () => clearTimeout(interval);
  }, [id]);

  if (loading && !data) return <div className="p-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" /> Loading...</div>;
  if (!data) return <div className="p-12 text-center">Presentation not found.</div>;

  const filteredSlides = data.slides?.filter((slide: any) => 
    slide.raw_text.toLowerCase().includes(search.toLowerCase()) || 
    slide.summary.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleStartSession = async () => {
    try {
      setSessionStarting(true);
      const userId = localStorage.getItem("user_id");
      const res = await api.post("/sessions/start", {
        user_id: userId,
        presentation_id: id
      });
      alert(`Session Started! ID: ${res.data.session_id}\n\nPlease open the PresentMate Chrome Extension to connect and view live hints.`);
    } catch (err) {
      console.error(err);
      alert("Failed to start session.");
    } finally {
      setSessionStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex gap-4">
          <Button 
            disabled={data.processing_status !== "ready" || sessionStarting}
            onClick={handleStartSession}
          >
            {sessionStarting ? "Starting..." : "Start Slide Session"}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 truncate max-w-2xl">{data.title}</h1>
            <p className="text-slate-500 mb-4">{data.total_slides} slides • Status: <span className="capitalize font-medium text-blue-600">{data.processing_status}</span></p>
            {data.processing_status === "processing" && (
              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md font-medium">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> AI is generating summaries, this may take a minute...
              </div>
            )}
          </div>
        </div>

        {data.slides && data.slides.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Slide Insights</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search slides..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              {filteredSlides.map((slide: any) => (
                <div key={slide.slide_number} className="bg-white p-6 rounded-xl shadow-sm border flex gap-6">
                  <div className="flex-shrink-0 w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center border text-slate-400 font-bold text-lg">
                    {slide.slide_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-slate-800 mb-2">Summary</h3>
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed">{slide.summary || "No summary available."}</p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 mb-2">Key Talking Points</h4>
                        <ul className="list-disc leading-relaxed pl-5 text-sm text-slate-600 space-y-1 marker:text-blue-500">
                          {slide.key_points?.map((pt: string, idx: number) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 mb-2">Likely Audience Questions</h4>
                        <ul className="list-disc leading-relaxed pl-5 text-sm text-slate-600 space-y-1 marker:text-green-500">
                          {slide.likely_questions?.map((q: string, idx: number) => (
                            <li key={idx} className="italic">{q}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
