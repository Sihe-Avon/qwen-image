async function fetchGenerations() {
  const res = await fetch("http://localhost:3000/api/generations", { cache: "no-store" });
  if (!res.ok) return { items: [] };
  return res.json();
}

export default async function MyCreationsPage() {
  const data = await fetchGenerations();
  return (
    <div className="min-h-screen w-full flex flex-col items-center p-8 gap-8 page-bg">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-semibold tracking-tight mb-6" style={{ fontFamily: "var(--font-display), var(--font-inter), system-ui" }}>My Creations</h1>
        {data.items.length === 0 ? (
          <div className="opacity-70">No creations yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.items.map((g: any) => (
              <div key={g.id} className="glass-card p-2 flex flex-col gap-2">
                <div className="text-xs opacity-70 line-clamp-2">{g.prompt}</div>
                <div className="grid grid-cols-2 gap-2">
                  {g.images.map((im: any, i: number) => (
                    <a key={i} href={im.url} target="_blank" className="block">
                      <img src={im.url} className="w-full h-auto rounded" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


