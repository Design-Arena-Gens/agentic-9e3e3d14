import { NextResponse } from 'next/server';
import { fetchLatestItems, pickTopStories, makeScript, makeTitle, makeHashtags, makeThumbnailText, suggestVisuals } from '../../../lib/news';

export const revalidate = 0;

export async function GET() {
  try {
    const all = await fetchLatestItems();
    const picked = pickTopStories(all, 3);
    const payload = {
      updatedAt: new Date().toISOString(),
      items: picked,
      script: makeScript(picked),
      title: makeTitle(picked),
      hashtags: makeHashtags(picked),
      thumbnailText: makeThumbnailText(picked),
      visuals: suggestVisuals(picked)
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate' }, { status: 500 });
  }
}
