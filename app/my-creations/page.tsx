"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ImageModal } from "@/app/components/ImageModal";

interface Generation {
  id: string;
  prompt: string;
  images: Array<{ url: string; width: number; height: number }>;
  createdAt: number;
  costCredits: number;
}

export default function MyCreationsPage() {
  const { data: session } = useSession();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (session) {
      fetchGenerations();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchGenerations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/generations", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setGenerations(data.items || []);
    } catch (err: any) {
      console.error("Failed to fetch generations:", err);
      setError(err.message || "Failed to load creations");
    } finally {
      setLoading(false);
    }
  };
  if (!session) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 gap-8 page-bg">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Please sign in to view your creations</h1>
          <p className="text-gray-600">You need to be logged in to see your generated images.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-8 gap-8 page-bg">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-semibold tracking-tight mb-6" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>My Creations</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your creations...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button 
              onClick={fetchGenerations}
              className="ui-button"
            >
              Try Again
            </button>
          </div>
        ) : generations.length === 0 ? (
          <div className="opacity-70">No creations yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {generations.map((g: Generation) => (
              <div key={g.id} className="glass-card p-2 flex flex-col gap-2">
                <div className="text-xs opacity-70 line-clamp-2">{g.prompt}</div>
                <div className="grid grid-cols-2 gap-2">
                  {g.images.map((im: any, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedImage({ src: im.url, alt: `${g.prompt} - Image ${i + 1}` })}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <img src={im.url} className="w-full h-auto rounded" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          src={selectedImage.src}
          alt={selectedImage.alt}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}


