"use client";
import { useEffect, useMemo, useState } from 'react';

type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string; // ISO
};

type ApiResponse = {
  updatedAt: string;
  items: NewsItem[];
  script: string;
  title: string;
  hashtags: string[];
  thumbnailText: string;
  visuals: string[];
};

export default function HomePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/generate', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const hashtags = useMemo(() => data?.hashtags?.join(' '), [data]);

  const speak = () => {
    if (!data) return;
    const utter = new SpeechSynthesisUtterance(data.script);
    utter.rate = 1.05;
    utter.pitch = 1.0;
    utter.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const stopSpeak = () => { window.speechSynthesis.cancel(); };

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <h1 className="h1">TechSpace AI</h1>
            <div className="tag">Autonomous news curator & short script generator</div>
          </div>
        </div>
        <button className="btn" disabled={loading} onClick={fetchData}>
          {loading ? 'Fetching?' : 'Regenerate'}
        </button>
      </header>

      {error && <div className="card">{error}</div>}

      <div className="grid">
        <section className="card">
          <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
            <div className="sectionTitle">60s Script</div>
            <div className="small">Updated: {data ? new Date(data.updatedAt).toLocaleString() : '-'}</div>
          </div>
          <div className="output" style={{marginTop:8}}>
            {data?.script || 'Loading?'}
          </div>
          <div className="row" style={{marginTop:12}}>
            <button className="btn secondary" onClick={speak}>Play voice-over</button>
            <button className="btn secondary" onClick={stopSpeak}>Stop</button>
          </div>

          <div className="sectionTitle" style={{marginTop:16}}>YouTube Title</div>
          <div className="output">{data?.title}</div>

          <div className="sectionTitle" style={{marginTop:16}}>Hashtags</div>
          <div className="output">{hashtags}</div>
        </section>

        <aside className="card">
          <div className="sectionTitle">Thumbnail preview</div>
          <div className="thumbnail">
            <h3>{data?.thumbnailText || 'Tech & Space Breaking News'}</h3>
          </div>
          <div className="sectionTitle" style={{marginTop:16}}>Visual prompts</div>
          <ul>
            {data?.visuals?.map((v,i) => (<li key={i} className="small">? {v}</li>))}
          </ul>
          <div className="sectionTitle" style={{marginTop:16}}>Cited sources</div>
          <div className="row">
            {data?.items?.map((item, i) => (
              <div key={i} className="source">
                <div className="badge">{item.source}</div>
                <div><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a></div>
              </div>
            ))}
          </div>
          <div className="small" style={{marginTop:8}}>Sources are Google News article URLs from the last 24h.</div>
        </aside>
      </div>
    </div>
  );
}
