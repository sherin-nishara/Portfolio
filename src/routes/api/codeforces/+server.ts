import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const HANDLE = 'sherinars2004';
const CACHE_TTL_MS = 1000 * 60 * 60;
let cache: { data: unknown; fetchedAt: number } | null = null;

export const GET: RequestHandler = async () => {
	if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
		return json(cache.data, { headers: { 'Cache-Control': 'public, max-age=300' } });
	}
	try {
		const [infoRes, ratingRes] = await Promise.all([
			fetch(`https://codeforces.com/api/user.info?handles=${HANDLE}`, {
				headers: { 'User-Agent': 'Mozilla/5.0 portfolio' }
			}),
			fetch(`https://codeforces.com/api/user.rating?handle=${HANDLE}`, {
				headers: { 'User-Agent': 'Mozilla/5.0 portfolio' }
			})
		]);
		if (!infoRes.ok) throw new Error(`CF info ${infoRes.status}`);
		const info = await infoRes.json();
		const u = info.result?.[0];
		if (!u) throw new Error('CF user not found');

		let contests = 0;
		if (ratingRes.ok) {
			const r = await ratingRes.json();
			if (r.status === 'OK' && Array.isArray(r.result)) contests = r.result.length;
		}

		const data = {
			handle: u.handle,
			profileUrl: `https://codeforces.com/profile/${u.handle}`,
			rating: u.rating ?? null,
			maxRating: u.maxRating ?? null,
			rank: u.rank ?? 'unrated',
			maxRank: u.maxRank ?? null,
			contests,
			updatedAt: new Date().toISOString()
		};
		cache = { data, fetchedAt: Date.now() };
		return json(data, { headers: { 'Cache-Control': 'public, max-age=300' } });
	} catch (e) {
		if (cache) return json(cache.data);
		return json({ error: (e as Error).message }, { status: 502 });
	}
};
