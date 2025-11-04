import Parser from 'rss-parser';

export type ParsedItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string; // ISO
};

const parser = new Parser({ timeout: 10000 });

const FEEDS = [
  'https://news.google.com/rss/search?q=technology+when:1d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=space+exploration+when:1d&hl=en-US&gl=US&ceid=US:en'
];

function normalizeItem(item: any): ParsedItem | null {
  if (!item?.link || !item?.title) return null;
  const source = (item?.source?.['$']?.url || item?.source || '').toString() || 'Google News';
  const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
  const link = typeof item.link === 'string' ? item.link : Array.isArray(item.link) ? item.link[0] : '';
  return { title: item.title, link, source, publishedAt: pubDate };
}

export async function fetchLatestItems(): Promise<ParsedItem[]> {
  const results = await Promise.allSettled(FEEDS.map((url) => parser.parseURL(url)));
  const items: ParsedItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const it of r.value.items || []) {
        const n = normalizeItem(it);
        if (n) items.push(n);
      }
    }
  }
  // dedupe by title or link
  const seen = new Set<string>();
  const deduped = items.filter((it) => {
    const key = (it.title + '|' + it.link).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // sort by date desc
  deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return deduped.slice(0, 12); // shortlist
}

export function pickTopStories(items: ParsedItem[], count: number = 3): ParsedItem[] {
  return items.slice(0, Math.max(1, Math.min(count, 3)));
}

export function makeTitle(stories: ParsedItem[]): string {
  if (stories.length === 1) {
    return `${shorten(stories[0].title, 70)} | TechSpace AI`;
  }
  const parts = stories
    .map((s) => s.title.split(':')[0])
    .slice(0, 3)
    .map((t) => shorten(t, 30));
  return `${parts.join(' ? ')} | TechSpace AI`;
}

export function makeHashtags(stories: ParsedItem[]): string[] {
  const base = ['#TechNews', '#Space', '#AI', '#Science', '#Shorts'];
  const derived = stories.flatMap((s) => extractTagsFromTitle(s.title));
  const uniq = Array.from(new Set([...derived, ...base]));
  return uniq.slice(0, 8);
}

function extractTagsFromTitle(title: string): string[] {
  const words = title.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const candidates = words
    .filter((w) => w.length > 3)
    .map((w) => '#' + w[0].toUpperCase() + w.slice(1).toLowerCase())
    .slice(0, 5);
  return candidates;
}

function shorten(s: string, n: number): string { return s.length > n ? s.slice(0, n - 1) + '?' : s; }

export function makeScript(stories: ParsedItem[]): string {
  const introOptions = [
    'Did you know?',
    'Quick tech & space update!',
    "Here's what's new in the last 24 hours:",
  ];
  const intro = introOptions[Math.floor(Math.random() * introOptions.length)];
  const lines: string[] = [];
  lines.push(`${intro}`);
  for (const s of stories.slice(0,3)) {
    const by = s.source ? ` ? via ${s.source}` : '';
    lines.push(`? ${cleanTitleForNarration(s.title)}${by}.`);
  }
  lines.push('Follow for daily TechSpace AI updates!');
  const script = lines.join('\n');
  // basic limit: aim for < 900 characters
  return shorten(script, 900);
}

function cleanTitleForNarration(title: string): string {
  // Remove bracketed publishers and site suffixes
  return title
    .replace(/\s*-\s*[^-]+$/g, '')
    .replace(/\s*\|\s*[^|]+$/g, '')
    .trim();
}

export function makeThumbnailText(stories: ParsedItem[]): string {
  if (stories.length === 1) return shorten(cleanTitleForNarration(stories[0].title), 48);
  return shorten(stories.map((s) => cleanTitleForNarration(s.title)).slice(0,2).join(' ? '), 48);
}

export function suggestVisuals(stories: ParsedItem[]): string[] {
  const prompts = stories.slice(0,3).map((s) => {
    const t = cleanTitleForNarration(s.title);
    return `9:16 clip: dynamic headline animation for \"${t}\", cosmic gradient background, subtle HUD lines`;
  });
  prompts.push('End card: TechSpace AI logo with \"Follow for daily updates\"');
  return prompts;
}
