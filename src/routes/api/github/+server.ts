import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

const USER = 'sherin-nishara';
const CACHE_TTL_MS = 1000 * 60 * 60;
let cache: { data: unknown; fetchedAt: number } | null = null;

export const GET: RequestHandler = async () => {
	if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
		return json(cache.data, { headers: { 'Cache-Control': 'public, max-age=300' } });
	}
	try {
		const [userRes, reposRes, commitsRes] = await Promise.all([
			fetch(`https://api.github.com/users/${USER}`, {
				headers: { 'User-Agent': 'portfolio', Accept: 'application/vnd.github+json' }
			}),
			fetch(`https://api.github.com/users/${USER}/repos?per_page=100`, {
				headers: { 'User-Agent': 'portfolio', Accept: 'application/vnd.github+json' }
			}),
			fetch(`https://api.github.com/search/commits?q=author:${USER}`, {
				headers: {
					'User-Agent': 'portfolio',
					Accept: 'application/vnd.github.cloak-preview'
				}
			})
		]);
		if (!userRes.ok) throw new Error(`GitHub user ${userRes.status}`);
		const u = await userRes.json();
		const repos = reposRes.ok ? await reposRes.json() : [];
		const stars = Array.isArray(repos)
			? repos.reduce((s: number, r: { stargazers_count?: number }) => s + (r.stargazers_count ?? 0), 0)
			: 0;
		let commits = 0;
		if (commitsRes.ok) {
			const c = await commitsRes.json();
			commits = c.total_count ?? 0;
		}

		const data = {
			username: USER,
			profileUrl: `https://github.com/${USER}`,
			publicRepos: u.public_repos ?? 0,
			followers: u.followers ?? 0,
			following: u.following ?? 0,
			totalStars: stars,
			commits, // searchable commits — good proxy for "contributions"
			updatedAt: new Date().toISOString()
		};
		cache = { data, fetchedAt: Date.now() };
		return json(data, { headers: { 'Cache-Control': 'public, max-age=300' } });
	} catch (e) {
		if (cache) return json(cache.data);
		return json({ error: (e as Error).message }, { status: 502 });
	}
};
