"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { FileUp, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return;
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/presentations/upload?user_id=${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans p-6 overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
      
      <div className="max-w-3xl mx-auto mt-12 z-10 relative">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-3 py-2 rounded-lg transition-all mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-teal-50 p-10 text-center animate-fade-in-up">
          <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileUp className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Upload Presentation</h2>
          <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto">Upload your PDF or PPTX file and let AI instantly generate your speaking notes and QA hints.</p>
          
          <div className="border-2 border-dashed border-teal-300 rounded-2xl p-16 mb-8 bg-cream-50/50 hover:bg-teal-50 hover:border-teal-400 transition-all group">
            <input 
              type="file" 
              accept=".pdf,.pptx"
              className="hidden"
              id="file-upload"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <span className="bg-white border border-teal-100 shadow-sm px-6 py-3 rounded-xl font-bold text-sm text-teal-700 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-colors mb-4 inline-block">
                Select File to Upload
              </span>
              <span className="text-slate-500 font-medium text-sm">
                {file ? (
                  <span className="text-teal-700 bg-teal-50 px-3 py-1 rounded-md">{file.name}</span>
                ) : "Supported formats: PDF, PPTX"}
              </span>
            </label>
          </div>

          {error && <p className="text-red-500 bg-red-50 font-medium border border-red-100 p-3 rounded-xl text-sm mb-6">{error}</p>}

          <Button 
            size="lg" 
            className="w-full max-w-md mx-auto flex items-center justify-center bg-teal-600 hover:bg-teal-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-600/20 transition-all rounded-xl font-bold py-6 text-lg border-none text-white disabled:opacity-60 disabled:hover:translate-y-0"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : null}
            {loading ? "Uploading & Analyzing..." : "Process Presentation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
