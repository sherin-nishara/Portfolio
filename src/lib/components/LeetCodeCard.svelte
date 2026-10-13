<script lang="ts">
	import { onMount } from 'svelte';
	import type { LeetCodePayload } from '../../routes/api/leetcode/+server';

	type State =
		| { status: 'loading' }
		| { status: 'error'; message: string }
		| { status: 'ready'; data: LeetCodePayload & { stale?: boolean } };

	let state: State = $state({ status: 'loading' });
	let autoRefreshTimer: ReturnType<typeof setInterval> | undefined;

	async function load(force = false) {
		try {
			state = { status: 'loading' };
			const res = await fetch(`/api/leetcode${force ? '?refresh=1' : ''}`);
			if (!res.ok) throw new Error(`API ${res.status}`);
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			state = { status: 'ready', data };
		} catch (e) {
			state = { status: 'error', message: (e as Error).message };
		}
	}

	onMount(() => {
		load();
		// Re-validate every 60 min — rank auto-updates without redeploy
		autoRefreshTimer = setInterval(() => load(), 1000 * 60 * 60);
		return () => clearInterval(autoRefreshTimer);
	});

	let rankText = $derived.by(() => {
		if (state.status !== 'ready') return 'Unranked';
		return state.data.ranking ? `#${state.data.ranking.toLocaleString()}` : 'Unranked';
	});
</script>

<section
	class="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-6 text-left shadow-sm sm:p-8"
	aria-live="polite"
>
	<div class="flex items-start justify-between gap-4">
		<div class="flex items-center gap-4">
			{#if state.status === 'ready' && state.data.avatar}
				<img
					src={state.data.avatar}
					alt="LeetCode avatar"
					class="h-14 w-14 rounded-full border object-cover"
					loading="lazy"
				/>
			{:else}
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-bold"
				>
					LC
				</div>
			{/if}
			<div>
				<p class="text-xs uppercase tracking-[0.25em] text-muted-foreground">
					LeetCode · auto-updates
				</p>
				<h2 class="mt-1 text-2xl font-semibold tracking-tight">
					{#if state.status === 'ready'}
						<a
							href={state.data.profileUrl}
							target="_blank"
							rel="noreferrer"
							class="underline-offset-4 hover:underline"
						>
							@{state.data.username}
						</a>
					{:else}
						@sherinars2004
					{/if}
				</h2>
			</div>
		</div>
		<button
			onclick={() => load(true)}
			class="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
			title="Force refresh from LeetCode"
		>
			↻ Refresh
		</button>
	</div>

	{#if state.status === 'loading'}
		<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each Array(4) as _}
				<div class="h-20 animate-pulse rounded-xl bg-muted"></div>
			{/each}
		</div>
		<p class="mt-4 text-sm text-muted-foreground">Fetching live rank…</p>
	{:else if state.status === 'error'}
		<div class="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
			<p class="font-medium">Couldn't load LeetCode right now.</p>
			<p class="mt-1 text-muted-foreground">{state.message}</p>
			<button onclick={() => load(true)} class="mt-3 underline underline-offset-4">
				Try again
			</button>
		</div>
	{:else if state.status === 'ready'}
		<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl bg-muted/60 p-4">
				<p class="text-xs uppercase tracking-wider text-muted-foreground">Rank</p>
				<p class="mt-1 text-2xl font-bold tabular-nums">{rankText}</p>
			</div>
			<div class="rounded-xl bg-muted/60 p-4">
				<p class="text-xs uppercase tracking-wider text-muted-foreground">Solved</p>
				<p class="mt-1 text-2xl font-bold tabular-nums">{state.data.solved.total}</p>
			</div>
			<div class="rounded-xl bg-muted/60 p-4">
				<p class="text-xs uppercase tracking-wider text-muted-foreground">Reputation</p>
				<p class="mt-1 text-2xl font-bold tabular-nums">{state.data.reputation}</p>
			</div>
			<div class="rounded-xl bg-muted/60 p-4">
				<p class="text-xs uppercase tracking-wider text-muted-foreground">Contest</p>
				<p class="mt-1 text-lg font-bold">
					{state.data.contest?.rating ?? '—'}
					{#if state.data.contest}
						<span class="block text-xs font-normal text-muted-foreground">
							{state.data.contest.attended} attended
						</span>
					{:else}
						<span class="block text-xs font-normal text-muted-foreground">
							no contests yet
						</span>
					{/if}
				</p>
			</div>
		</div>

		<div class="mt-4 space-y-2 text-sm">
			{#each [['Easy', state.data.solved.easy, 'bg-emerald-500'], ['Medium', state.data.solved.medium, 'bg-amber-500'], ['Hard', state.data.solved.hard, 'bg-red-500']] as [label, count, color]}
				<div class="flex items-center gap-3">
					<span class="w-16 text-muted-foreground">{label}</span>
					<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class={`h-full ${color}`}
							style={`width: ${state.data.solved.total ? Math.round(((count as number) / state.data.solved.total) * 100) : 0}%`}
						></div>
					</div>
					<span class="w-10 text-right font-mono tabular-nums">{count}</span>
				</div>
			{/each}
		</div>

		{#if state.data.topLanguages.length}
			<p class="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Top languages</p>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each state.data.topLanguages as lang}
					<span
						class="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs"
					>
						{lang.language} · {lang.solved}
					</span>
				{/each}
			</div>
		{/if}

		<p class="mt-5 font-mono text-[11px] text-muted-foreground">
			Updated {new Date(state.data.updatedAt).toLocaleString()} · cached 1h · source leetcode.com
			{#if state.data.stale}
				· showing stale cache (upstream failed)
			{/if}
		</p>
	{/if}
</section>
