"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useDevSession } from "@/hooks/useDevSession";
import FancySelect from "@/app/components/FancySelect";

type Aspect = "1:1" | "16:9" | "3:2" | "2:3" | "4:3" | "9:16";

const ASPECT_TO_SIZE: Record<Aspect, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1536, height: 864 },
  "3:2": { width: 1500, height: 1000 },
  "2:3": { width: 1024, height: 1536 },
  "4:3": { width: 1408, height: 1056 },
  "9:16": { width: 864, height: 1536 },
};

const MAX_LONG_EDGE = 1536;

function BackgroundBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[480px] w-[480px] blur-3xl rounded-full opacity-40"
           style={{ background: "radial-gradient(circle at 30% 30%, #8b5cf6, transparent 60%)" }} />
      <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] blur-3xl rounded-full opacity-40"
           style={{ background: "radial-gradient(circle at 70% 70%, #06b6d4, transparent 60%)" }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[420px] w-[420px] blur-3xl rounded-full opacity-30"
           style={{ background: "radial-gradient(circle at 50% 50%, #22c55e, transparent 60%)" }} />
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-8">
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>{title}</h2>
      {subtitle && <p className="text-sm opacity-70 mt-2">{subtitle}</p>}
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const devSession = useDevSession();
  
  // 使用 dev session 或 regular session
  const currentUser = devSession.user || session?.user;
  const isAuthenticated = devSession.status === 'authenticated' || status === 'authenticated';
  const isLoading = devSession.status === 'loading' || status === 'loading';
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<Aspect>("1:1");
  const [outputs, setOutputs] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Array<{ url: string; w: number; h: number }>>([]);
  const [me, setMe] = useState<{ credits: number; profileCompleted: boolean; user: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 固定定价信息
  const pricingInfo = {
    price: 9.99,
    credits: 100
  };

  useEffect(() => {
    if (session) {
      fetch("/api/me").then(async (r) => {
        if (r.ok) {
          setMe(await r.json());
        }
      }).catch(() => {});
    }
  }, [session]);

  const size = useMemo(() => ASPECT_TO_SIZE[aspect], [aspect]);
  const estimatedCredits = useMemo(() => {
    const mp = Math.ceil((size.width * size.height) / 1_000_000);
    return mp * outputs;
  }, [size, outputs]);

  const onGenerate = async () => {
    if (!session) {
      signIn();
      return;
    }

    setError(null);
    setLoading(true);
    setImages([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: aspect, numOutputs: outputs }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          signIn();
          return;
        }
        
        if (res.status === 402) {
          const errorData = await res.json().catch(() => ({}));
          if (errorData.dailyLimitReached) {
            setError(`Daily free limit reached. You can purchase credits for $${pricingInfo.price} to continue.`);
          } else {
            setError(`Insufficient credits. Need ${errorData.needCredits || estimatedCredits} credits.`);
          }
          return;
        }
        
        const t = await res.text();
        throw new Error(t || "Generation failed");
      }
      
      const data = await res.json();
      setImages(data.images.map((i: any) => ({ url: i.url, w: i.width, h: i.height })));
      
      // 更新用户余额
      if (data.usingFreeCredits) {
        // 使用了免费额度，不扣除用户余额
        setMe((m) => m ? { ...m } : m);
      } else {
        // 使用了用户余额
        setMe((m) => m ? { ...m, credits: data.remainingCredits } : m);
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="relative min-h-screen w-full page-bg">
      <BackgroundBlobs />

      {/* Hero + Generator */}
      <section className="px-4 pt-10 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>Qwen AI Image Generator</h1>
            <p className="mt-4 text-base opacity-80">
              Turn concise text ideas into polished visuals, fast and reliably.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <label className="text-sm font-medium">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your image in detail"
                className="mt-2 w-full ui-textarea"
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Aspect Ratio</label>
                  <FancySelect
                    value={aspect}
                    onChange={(v) => setAspect(v as Aspect)}
                    options={(Object.keys(ASPECT_TO_SIZE) as Aspect[]).map((a) => ({ label: a, value: a }))}
                    size="sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Number of Outputs</label>
                  <div className="flex gap-2">
                    {[1,2,3,4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setOutputs(n)}
                        className={`pill ${outputs===n?"!bg-[#eef2ff] border-[rgba(18,18,23,.18)] font-medium":""}`}
                        data-active={outputs===n}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Estimated Credits</label>
                  <div className="ui-input flex items-center">
                    {estimatedCredits}
                  </div>
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className="opacity-70">Max long edge:</span>
                    <strong>{MAX_LONG_EDGE}px</strong>
                    <span className="opacity-70">| Your credits:</span>
                    <strong>{me?.credits ?? "-"}</strong>
        </div>



                  <button
                    onClick={onGenerate}
                    disabled={loading || !prompt}
                    className="mt-4 ui-button w-full sm:w-auto"
                  >
                    {loading ? "Generating... (~7s)" : "Generate Images"}
                  </button>
                </>
              ) : (
                <div className="mt-4">
                  <button
                    onClick={() => signIn()}
                    className="ui-button w-full sm:w-auto"
                  >
                    Sign in with Google to Generate
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Get 5 free credits to start creating images
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800">{error}</div>
                  {error.includes("Daily free limit") && (
                    <div className="mt-2">
                      <a href="/pricing" className="text-red-600 underline hover:text-red-700 text-sm">
                        Buy {pricingInfo.credits} credits for ${pricingInfo.price}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card p-5 min-h-[240px]">
              <div className="text-sm font-medium mb-2">Recent Tasks</div>
              {images.length === 0 ? (
                <div className="text-sm opacity-70">No results yet. Try a prompt to get started ✨</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((im, idx) => (
                    <a key={idx} href={im.url} target="_blank" className="block border border-black/10 dark:border-white/15 rounded-md overflow-hidden">
                      <img src={im.url} alt="result" className="w-full h-auto" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What is Qwen Image AI */}
      <section className="px-4 py-14">
        <SectionTitle title="What is Qwen Image AI?" />
        <div className="max-w-4xl mx-auto glass-card p-6 text-sm opacity-90">
          Our system is a large diffusion transformer tailored for faithful text-in-image rendering and fine-grained edits. It copes well with complex text layouts and varied styles from realistic to illustrative.
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 py-8">
        <SectionTitle title="Create in four simple steps" subtitle="An intuitive flow from prompt to download." />
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: "Enter your text prompt", desc: "Describe the subject, style, composition or mood you want." },
            { title: "Select your parameters", desc: "Pick aspect ratio and outputs. Estimated credits are shown instantly." },
            { title: "Generate your image", desc: "Start rendering. Average completion within a few seconds." },
            { title: "Download and use", desc: "Open full size results or iterate with a refined prompt." },
          ].map((s, i) => (
            <div key={i} className="glass-card p-5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold mt-0.5 shrink-0">{i+1}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">Step {i+1}: {s.title}</div>
                <div className="text-xs opacity-70 mt-1 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose */}
      <section className="px-4 py-14">
        <SectionTitle title="Why choose this generator?" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Reliable text layout", desc: "Handles multi-line text and typographic details with high fidelity." },
            { title: "Versatile editing", desc: "Insert, remove, and refine objects; transfer styles with control." },
            { title: "Bilingual friendly", desc: "Strong rendering for both English and Chinese characters." },
            { title: "Production quality", desc: "From photorealistic to stylistic outputs with consistent quality." },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-black/10 dark:border-white/15 p-5 bg-background/70">
              <div className="text-base font-medium mb-1">{f.title}</div>
              <div className="text-sm opacity-80">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12">
        <div className="max-w-3xl mx-auto rounded-xl border border-black/10 dark:border-white/15 p-6 text-center bg-background/70">
          <h3 className="text-xl font-semibold mb-2">Bring ideas to life in seconds</h3>
          <p className="text-sm opacity-80 mb-4">Focus on the message—let the model handle layout and style.</p>
          <a href="#" onClick={(e)=>{e.preventDefault(); const el=document.querySelector('textarea'); if(el) (el as HTMLTextAreaElement).focus();}}
             className="ui-button inline-flex">Generate Your First Image</a>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-14">
        <SectionTitle title="Frequently Asked Questions" />
        <div className="max-w-4xl mx-auto grid gap-3">
          {[
            {q:"How does Qwen Image AI work?", a:"We run an advanced diffusion transformer on server to turn prompts into images."},
            {q:"What makes Qwen Image unique for text rendering?", a:"It reliably renders multi-line paragraphs in English and Chinese."},
            {q:"Is there a free trial?", a:"Yes. New users receive 5 free credits."},
            {q:"How is inappropriate content handled?", a:"We apply rate limits and content filters where appropriate."},
          ].map((item, idx) => (
            <details key={idx} className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-background/70">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <div className="mt-2 text-sm opacity-80">{item.a}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
