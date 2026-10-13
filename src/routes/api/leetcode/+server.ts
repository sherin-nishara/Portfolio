import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const USERNAME = 'sherinars2004';
const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
// Cache for 1 hour to respect LeetCode + stay "automatic" on each visit
const CACHE_TTL_MS = 1000 * 60 * 60;

type Cached = { data: LeetCodePayload; fetchedAt: number };
let cache: Cached | null = null;

export type LeetCodePayload = {
	username: string;
	profileUrl: string;
	ranking: number | null;
	reputation: number;
	starRating: number | null;
	avatar: string | null;
	realName: string | null;
	aboutMe: string | null;
	solved: { total: number; easy: number; medium: number; hard: number };
	topLanguages: { language: string; solved: number }[];
	contest: {
		rating: number | null;
		globalRanking: number | null;
		attended: number;
		topPercentage: number | null;
		badge: string | null;
	} | null;
	updatedAt: string;
};

const QUERY = /* GraphQL */ `
	query getUserProfile($username: String!) {
		matchedUser(username: $username) {
			username
			profile {
				ranking
				reputation
				starRating
				userAvatar
				realName
				aboutMe
			}
			submitStatsGlobal {
				acSubmissionNum {
					difficulty
					count
				}
			}
			languageProblemCount {
				languageName
				problemsSolved
			}
		}
		userContestRanking(username: $username) {
			attendedContestsCount
			rating
			globalRanking
			totalParticipants
			topPercentage
			badge {
				name
			}
		}
	}
`;

async function fetchFromLeetCode(): Promise<LeetCodePayload> {
	const res = await fetch(LEETCODE_GRAPHQL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			// LeetCode blocks default fetch UAs — spoof a browser
			'User-Agent':
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
			Referer: `https://leetcode.com/u/${USERNAME}/`,
			Origin: 'https://leetcode.com'
		},
		body: JSON.stringify({ query: QUERY, variables: { username: USERNAME } })
	});

	if (!res.ok) throw new Error(`LeetCode upstream ${res.status}`);

	const body = (await res.json()) as {
		data?: {
			matchedUser: {
				username: string;
				profile: {
					ranking: number | null;
					reputation: number;
					starRating: number | null;
					userAvatar: string | null;
					realName: string | null;
					aboutMe: string | null;
				};
				submitStatsGlobal: { acSubmissionNum: { difficulty: string; count: number }[] };
				languageProblemCount: { languageName: string; problemsSolved: number }[];
			} | null;
			userContestRanking: {
				attendedContestsCount: number;
				rating: number | null;
				globalRanking: number | null;
				topPercentage: number | null;
				badge: { name: string } | null;
			} | null;
		};
		errors?: unknown;
	};

	if (!body.data?.matchedUser) throw new Error('LeetCode user not found');

	const u = body.data.matchedUser;
	const byDiff = Object.fromEntries(
		u.submitStatsGlobal.acSubmissionNum.map((d) => [d.difficulty, d.count])
	);

	return {
		username: u.username,
		profileUrl: `https://leetcode.com/u/${u.username}/`,
		ranking: u.profile.ranking,
		reputation: u.profile.reputation ?? 0,
		starRating: u.profile.starRating,
		avatar: u.profile.userAvatar,
		realName: u.profile.realName,
		aboutMe: u.profile.aboutMe,
		solved: {
			total: byDiff['All'] ?? 0,
			easy: byDiff['Easy'] ?? 0,
			medium: byDiff['Medium'] ?? 0,
			hard: byDiff['Hard'] ?? 0
		},
		topLanguages: [...(u.languageProblemCount ?? [])]
			.sort((a, b) => b.problemsSolved - a.problemsSolved)
			.slice(0, 4)
			.map((l) => ({ language: l.languageName, solved: l.problemsSolved })),
		contest: body.data.userContestRanking
			? {
					rating: body.data.userContestRanking.rating,
					globalRanking: body.data.userContestRanking.globalRanking,
					attended: body.data.userContestRanking.attendedContestsCount ?? 0,
					topPercentage: body.data.userContestRanking.topPercentage,
					badge: body.data.userContestRanking.badge?.name ?? null
				}
			: null,
		updatedAt: new Date().toISOString()
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const force = url.searchParams.get('refresh') === '1';
	const fresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;

	if (cache && fresh && !force) {
		return json(cache.data, {
			headers: { 'Cache-Control': 'public, max-age=300', 'X-Cache': 'HIT' }
		});
	}

	try {
		const data = await fetchFromLeetCode();
		cache = { data, fetchedAt: Date.now() };
		return json(data, {
			headers: { 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MISS' }
		});
	} catch (e) {
		// Serve stale cache rather than breaking the portfolio
		if (cache) {
			return json(
				{ ...cache.data, stale: true },
				{ headers: { 'Cache-Control': 'public, max-age=60', 'X-Cache': 'STALE' } }
			);
		}
		return json({ error: (e as Error).message }, { status: 502 });
	}
};
