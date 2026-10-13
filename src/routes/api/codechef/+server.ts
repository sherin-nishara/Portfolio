import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const USER = 'sherinnishara';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // scrape is heavy — 6h
let cache: { data: unknown; fetchedAt: number } | null = null;

function parse(html: string) {
	// Rating: <div class="rating-number">\n  625? ...
	const ratingM = html.match(/class="rating-number">\s*(\d+|NA)/);
	const rating = ratingM && ratingM[1] !== 'NA' ? parseInt(ratingM[1], 10) : null;
	const provisional = /Provisional/.test(html) && rating !== null;
	// Solved: "Total Problems Solved: 40" or "Problems Solved: 40"
	const solvedM =
		html.match(/Total Problems Solved[^0-9]*(\d+)/i) ??
		html.match(/Problems Solved[^0-9]*(\d+)/i);
	const solved = solvedM ? parseInt(solvedM[1], 10) : null;
	return { rating, provisional, solved };
}

export const GET: RequestHandler = async () => {
	if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
		return json(cache.data, { headers: { 'Cache-Control': 'public, max-age=600' } });
	}
	try {
		const res = await fetch(`https://www.codechef.com/users/${USER}`, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
			}
		});
		if (!res.ok) throw new Error(`CodeChef upstream ${res.status}`);
		const html = await res.text();
		if (!html.includes(USER)) throw new Error('CodeChef user not found');
		const { rating, provisional, solved } = parse(html);
		const data = {
			username: USER,
			profileUrl: `https://www.codechef.com/users/${USER}`,
			rating,
			provisional,
			solved,
			updatedAt: new Date().toISOString()
		};
		cache = { data, fetchedAt: Date.now() };
		return json(data, { headers: { 'Cache-Control': 'public, max-age=600' } });
	} catch (e) {
		if (cache) return json(cache.data);
		return json({ error: (e as Error).message }, { status: 502 });
	}
};
