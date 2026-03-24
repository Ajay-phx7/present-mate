"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { FileUp, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto mt-12">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <FileUp className="w-12 h-12 mx-auto text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Presentation</h2>
          <p className="text-slate-500 mb-8">Upload your PDF or PPTX file to generate AI insights.</p>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 mb-6 bg-slate-50 hover:bg-slate-100 transition-colors">
            <input 
              type="file" 
              accept=".pdf,.pptx"
              className="hidden"
              id="file-upload"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <span className="bg-white border px-4 py-2 rounded-md font-medium text-sm text-slate-700 hover:bg-slate-50 mb-3">
                Select File
              </span>
              <span className="text-slate-500 text-sm">
                {file ? file.name : "Supported formats: PDF, PPTX"}
              </span>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <Button 
            size="lg" 
            className="w-full" 
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "Uploading & Processing..." : "Upload File"}
          </Button>
        </div>
      </div>
    </div>
  );
}
