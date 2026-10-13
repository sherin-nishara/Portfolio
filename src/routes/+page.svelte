<script lang="ts">
	import { onMount } from 'svelte';
	import { asset, resolve } from '$app/paths';
	import GithubLogo from 'phosphor-svelte/lib/GithubLogo';
	import LinkedinLogo from 'phosphor-svelte/lib/LinkedinLogo';
	import XLogo from 'phosphor-svelte/lib/XLogo';
	import WhatsappLogo from 'phosphor-svelte/lib/WhatsappLogo';
	import EnvelopeSimple from 'phosphor-svelte/lib/EnvelopeSimple';
	import Code from 'phosphor-svelte/lib/Code';
	import FileText from 'phosphor-svelte/lib/FileText';
	import DownloadSimple from 'phosphor-svelte/lib/DownloadSimple';
	import ArrowUpRight from 'phosphor-svelte/lib/ArrowUpRight';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import projectsData from '#lib/projects.json';
	// Future use — LeetCode card hidden from home for now, kept for later:
	// import LeetCodeCard from '#lib/components/LeetCodeCard.svelte';

	const links = [
		{
			label: 'GitHub',
			href: 'https://github.com/sherin-nishara',
			Icon: GithubLogo
		},
		{
			label: 'LeetCode',
			href: 'https://leetcode.com/u/sherinars2004/',
			Icon: Code
		},
		{
			label: 'X',
			href: 'https://x.com/sherinnishara',
			Icon: XLogo
		},
		{
			label: 'LinkedIn',
			href: 'https://www.linkedin.com/in/sherinnishara',
			Icon: LinkedinLogo
		}
	];

	// Projects live in src/lib/projects.json — add new ones there, no page code to touch.
	type Project = {
		name: string;
		desc: string;
		href: string;
		cta: string;
		live?: string;
		demo?: string;
	};
	const projects: Project[] = projectsData;

	let carouselEl: HTMLDivElement | null = $state(null);

	function scrollProjects(dir: 1 | -1) {
		carouselEl?.scrollBy({ left: dir * 280, behavior: 'smooth' });
	}

	// demo preview: hidden entirely if the file is missing (no broken-image icon)
	let demoOk = $state(true);

	let loading = $state(true);
	let leetRank: number | null = $state(null);
	let cfRating: number | null = $state(null);
	let ccRating: number | null = $state(null);
	let ghCommits: number | null = $state(null);

	// --- Resume terminal (short + typeable) ---
	let input = $state('');
	let output = $state<string | null>(null);
	let termTyping = $state(false);

	function runTerminal() {
		if (termTyping) return;
		termTyping = true;
		output = null;
		input = '';
		const cmd = 'cat resume.pdf';
		let i = 0;
		const id = setInterval(() => {
			i += 1;
			input = cmd.slice(0, i);
			if (i >= cmd.length) {
				clearInterval(id);
				termTyping = false;
				output = 'resume';
			}
		}, 55);
	}

	function submitCmd(e?: Event) {
		e?.preventDefault();
		const c = input.trim().toLowerCase();
		if (!c || termTyping) return;
		if (c === 'clear') {
			input = '';
			output = null;
			return;
		}
		if (c === 'cat resume.pdf' || c.includes('resume') || c === 'open resume') output = 'resume';
		else if (c === 'help') output = 'help';
		else if (c === 'whoami') output = 'whoami';
		else output = `notfound:${input.trim()}`;
	}

	$effect(() => {
		if (!loading && input === '' && output === null && !termTyping) {
			const t = setTimeout(runTerminal, 500);
			return () => clearTimeout(t);
		}
	});

	const pad = (n: number | null) => (n === null ? '.....' : String(n).padStart(6, '0'));

	let rankLines = $derived.by(() => [
		`LC ${pad(leetRank)}`,
		`CF ${pad(cfRating)}`,
		`CC ${pad(ccRating)}`,
		`GH ${pad(ghCommits)}`
	]);

	onMount(() => {
		// Live ranks for loading screen — fire all four in parallel, don't block the 2.2s timer
		// NOTE: /api/* needs a server, so these 404 on GitHub Pages (static).
		// They fail silently and stats stay "....." — site still loads.
		fetch(resolve('/api/leetcode'))
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (d?.ranking) leetRank = d.ranking;
			})
			.catch(() => {});
		fetch(resolve('/api/codeforces'))
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (typeof d?.rating === 'number') cfRating = d.rating;
			})
			.catch(() => {});
		fetch(resolve('/api/codechef'))
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (typeof d?.rating === 'number') ccRating = d.rating;
			})
			.catch(() => {});
		fetch(resolve('/api/github'))
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (typeof d?.commits === 'number') ghCommits = d.commits;
			})
			.catch(() => {});

		const timer = setTimeout(() => {
			loading = false;
		}, 2200);
		return () => clearTimeout(timer);
	});
</script>

<svelte:head>
	<title>Sherin Nishara</title>
</svelte:head>

{#if loading}
	<main
		class="flex min-h-[100svh] items-center justify-center bg-[#f7f7f7] px-4 text-[#535353]"
		style="--dino-sprite: url({asset('dino/100-offline-sprite.png')})"
	>
		<div class="w-full max-w-xs sm:max-w-md" role="status" aria-live="polite">
			<div class="flex justify-center">
				<div class="game-box w-fit max-w-full bg-white/70 px-3 py-2 font-mono text-[10px] tabular-nums tracking-wider sm:px-4 sm:text-xs sm:tracking-widest">
					<div class="game-box-title mb-1.5 flex items-center justify-center gap-2 opacity-70">
						<span class="live-dot"></span> SCORE BOARD
					</div>
					<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-center sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6">
						{#each rankLines as line}
							<div class="whitespace-nowrap">{line}</div>
						{/each}
					</div>
				</div>
			</div>
			<div class="scene relative mt-8 h-32 overflow-hidden sm:mt-10 sm:h-44 lg:h-56">
				<div class="cloud cloud-1"></div>
				<div class="cloud cloud-2"></div>
				<div class="cloud cloud-3"></div>
				<div class="horizon"></div>
				<div class="ground"></div>
				<div class="cactus cactus-small"></div>
				<div class="cactus cactus-large"></div>
				<div class="dino"></div>
			</div>
			<p class="mt-5 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-500 sm:mt-6 sm:text-xs sm:tracking-[0.35em]">
				Loading
			</p>
		</div>
	</main>
{:else}
	<main class="flex h-[100svh] items-center justify-center overflow-hidden bg-background px-4 py-4 text-foreground sm:px-6">
		<div class="mx-auto flex max-h-full w-full max-w-3xl flex-col items-center justify-center overflow-hidden text-center">
			<blockquote
				class="mx-auto max-w-xl text-balance text-xs italic leading-relaxed text-muted-foreground sm:text-sm"
			>
				“I enjoy making systems interact and work together, whatever people call it—APIs,
				networking, IoT, distributed systems, or automation.”
			</blockquote>
			<h1 class="mt-3 text-2xl font-semibold tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">
				Sherin Nishara
			</h1>
			<nav aria-label="Social links" class="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3">
				{#each links as { label, href, Icon }}
					<a
						{href}
						target={href.startsWith('mailto:') ? undefined : '_blank'}
						rel={href.startsWith('mailto:') ? undefined : 'me noopener noreferrer'}
						aria-label={label}
						title={label}
						class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:h-11 sm:w-11"
					>
						<Icon size={18} weight="regular" aria-hidden="true" />
					</a>
				{/each}
			</nav>
			<div class="mt-5 flex w-full justify-center sm:mt-6">
				<div
					class="w-full max-w-[280px] border border-neutral-800 bg-neutral-950 py-2 pl-4 pr-2 font-mono text-xs text-neutral-100 shadow-sm sm:max-w-sm sm:text-[13px] {output && output !== 'resume' ? 'rounded-2xl' : 'rounded-full'}"
				>
					<form onsubmit={submitCmd} class="flex items-center gap-2">
						<span class="shrink-0 text-green-400">$</span>
						<label for="resume-term" class="sr-only">Type a command, try cat resume.pdf</label>
						<input
							id="resume-term"
							bind:value={input}
							placeholder="type 'help'…"
							autocomplete="off"
							spellcheck="false"
							class="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-600"
						/>
						{#if output === 'resume'}
							<span class="flex shrink-0 items-center gap-1.5 font-sans">
								<a
									href={asset('resume.pdf')}
									target="_blank"
									rel="noopener"
									class="inline-flex items-center gap-1 rounded-full bg-green-400 px-3 py-1 text-[11px] font-semibold text-neutral-950 transition hover:bg-green-300"
								>
									<FileText size={12} aria-hidden="true" /> open
								</a>
								<a
									href={asset('resume.pdf')}
									download
									aria-label="Download resume"
									title="Download resume"
									class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-green-400/40 text-green-200 transition hover:bg-green-400/10"
								>
									<DownloadSimple size={12} aria-hidden="true" />
								</a>
							</span>
						{:else}
							<button
								type="submit"
								aria-label="Run command"
								class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-300 transition hover:bg-green-400 hover:text-neutral-950"
							>
								↵
							</button>
						{/if}
					</form>
					{#if output && output !== 'resume'}
						<div class="px-6 pt-1 font-sans text-[11px] text-neutral-400">
							{#if output === 'help'}
								try: cat resume.pdf · whoami · clear
							{:else if output === 'whoami'}
								<span>mail me → <a href="mailto:sherinnishara@outlook.com" class="text-amber-200 underline underline-offset-2">sherinnishara@outlook.com</a></span>
							{:else if output.startsWith('notfound:')}
								not found — try 'help'
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<section aria-label="Projects" class="mx-auto mt-6 w-full max-w-xl shrink-0 sm:mt-6">
				<div
					bind:this={carouselEl}
					role="region"
					aria-label="Projects carousel"
					class="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-14 pb-1 [justify-content:safe_center]"
				>
					{#each projects as p}
						<article
							title={p.demo ? 'Hover to preview — move away for details' : p.name}
							class="group/card relative w-[220px] min-w-[220px] max-w-[220px] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-card p-4 text-card-foreground sm:w-[260px] sm:min-w-[260px] sm:max-w-[260px]"
						>
							{#if demoOk && p.demo}
								<div class="absolute inset-0 hidden group-hover/card:block">
									<img src={p.demo.startsWith('/') ? asset(p.demo.slice(1)) : p.demo} alt="{p.name} demo" fetchpriority="high" onerror={() => (demoOk = false)} class="h-full w-full object-cover" />
									<a
										href={p.href}
										target="_blank"
										rel="me noopener noreferrer"
										class="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-neutral-950/85 px-3 py-1.5 text-[12px] font-semibold text-white"
									>
										{p.cta} <ArrowUpRight size={12} aria-hidden="true" />
									</a>
								</div>
							{/if}
							<div class={demoOk && p.demo ? 'group-hover/card:invisible' : ''}>
								<div class="flex items-start justify-between gap-2">
									<h3 class="text-sm font-semibold tracking-tight">{p.name}</h3>
								</div>
								<p class="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
									{p.desc}
								</p>
								<div class="mt-3 flex items-center gap-3 text-[12px]">
									<a
										href={p.href}
										target="_blank"
										rel="me noopener noreferrer"
										class="inline-flex items-center gap-0.5 font-medium underline underline-offset-4 hover:opacity-70"
									>
										{p.cta} <ArrowUpRight size={12} aria-hidden="true" />
									</a>
									{#if p.live}
										<a
											href={p.live}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
										>
											live <ArrowUpRight size={12} aria-hidden="true" />
										</a>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				</div>
				<div class="mt-2 flex items-center justify-center gap-2">
					<button
						type="button"
						onclick={() => scrollProjects(-1)}
						aria-label="Scroll projects left"
						class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
					>
						<CaretLeft size={15} aria-hidden="true" />
					</button>
					<button
						type="button"
						onclick={() => scrollProjects(1)}
						aria-label="Scroll projects right"
						class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
					>
						<CaretRight size={15} aria-hidden="true" />
					</button>
				</div>
			</section>
			<footer aria-label="Contact" class="mx-auto mt-6 w-full max-w-xl shrink-0 text-center sm:mt-6">
				<div class="flex items-center justify-center gap-2 text-muted-foreground">
					<span class="hidden min-w-0 truncate text-[13px] italic sm:inline">I can make your thoughts into Digital Reality, Lets Connect</span>
					<span class="shrink-0 text-[13px] italic sm:hidden">Lets Connect</span>
					<a
						href="https://wa.me/917373221121"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="WhatsApp +91 7373221121, WhatsApp only"
						title="WhatsApp only"
						class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground"
					>
						<WhatsappLogo size={17} aria-hidden="true" />
					</a>
					<span class="shrink-0 text-[10px]">WhatsApp only</span>
					<a
						href="mailto:sherinnishara@outlook.com"
						aria-label="Email sherinnishara@outlook.com"
						title="Email"
						class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground"
					>
						<EnvelopeSimple size={17} aria-hidden="true" />
					</a>
				</div>
			</footer>
		</div>
		<!-- Future use — LeetCode card hidden from home for now:
		<div class="mt-10">
			<LeetCodeCard />
		</div>
		-->
	</main>
{/if}

<style>
	.no-scrollbar {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.scene {
		font-family: 'JetBrains Mono Variable', monospace;
	}

	.cloud {
		position: absolute;
		width: 46px;
		height: 14px;
		opacity: 0.35;
		background-image: var(--dino-sprite);
		background-position: -86px -2px;
		background-repeat: no-repeat;
		image-rendering: pixelated;
	}

	.cloud-1 {
		top: 12%;
		left: 10%;
		animation: cloud-drift 22s linear infinite;
	}

	.cloud-2 {
		top: 18%;
		left: 42%;
		animation: cloud-drift 28s linear infinite;
	}

	.cloud-3 {
		top: 30%;
		right: 12%;
		animation: cloud-drift 26s linear infinite;
	}

	.horizon {
		position: absolute;
		left: 0;
		right: 0;
		top: 68%;
		border-top: 1px solid #c7c7c7;
	}

	.ground {
		position: absolute;
		left: 0;
		right: 0;
		top: 68%;
		height: 18px;
		opacity: 0.45;
		background-image: radial-gradient(circle, #bdbdbd 1px, transparent 1px);
		background-size: 18px 5px;
		background-repeat: repeat-x;
		animation: ground-move 0.45s linear infinite;
	}

	.dino {
		position: absolute;
		left: 14%;
		bottom: 30%;
		width: 44px;
		height: 47px;
		background-image: var(--dino-sprite);
		background-repeat: no-repeat;
		image-rendering: pixelated;
		animation:
			treX-frame 0.32s linear infinite,
			treX-bob 0.32s ease-in-out infinite;
	}

	.cactus {
		position: absolute;
		bottom: 30%;
		background-image: var(--dino-sprite);
		background-repeat: no-repeat;
		image-rendering: pixelated;
	}

	.cactus-small {
		right: 24%;
		width: 17px;
		height: 35px;
		background-position: -228px -2px;
	}

	.cactus-large {
		right: 11%;
		width: 25px;
		height: 50px;
		background-position: -332px -2px;
	}

	@keyframes treX-frame {
		0%,
		49.9% {
			background-position: -936px -2px;
		}
		50%,
		100% {
			background-position: -980px -2px;
		}
	}

	@keyframes treX-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
	}

	@keyframes ground-move {
		to {
			background-position-x: -18px;
		}
	}

	@keyframes cloud-drift {
		from {
			margin-left: 0;
		}
		to {
			margin-left: -70px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dino,
		.ground,
		.cloud {
			animation: none;
		}
		.live-dot {
			animation: none;
		}
	}

	.game-box {
		border: 2px solid #535353;
		box-shadow:
			3px 3px 0 #535353,
			inset 0 0 0 2px #f7f7f7,
			inset 0 0 0 4px #d9d9d9;
		border-radius: 2px;
		image-rendering: pixelated;
	}

	.game-box-title {
		font-size: 0.55rem;
		letter-spacing: 0.25em;
	}

	.live-dot {
		width: 6px;
		height: 6px;
		background: #22c55e;
		box-shadow: 0 0 0 2px #bbf7d0;
		animation: blink 1s steps(2, start) infinite;
	}

	@media (min-width: 640px) {
		.game-box {
			box-shadow:
				4px 4px 0 #535353,
				inset 0 0 0 2px #f7f7f7,
				inset 0 0 0 4px #d9d9d9;
		}
		.game-box-title {
			font-size: 0.65rem;
			letter-spacing: 0.3em;
		}
		.live-dot {
			width: 8px;
			height: 8px;
		}
	}

	@media (max-width: 639px) {
		.dino,
		.cactus {
			scale: 0.8;
			transform-origin: bottom left;
		}
		.cloud {
			scale: 0.85;
		}
	}

	@keyframes blink {
		to {
			visibility: hidden;
		}
	}
</style>
