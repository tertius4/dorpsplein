<script lang="ts">
	import Card from '#lib/components/Card.svelte';
	import Button from '#lib/components/Button.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import { getHome } from '#lib/remote/home.remote.ts';
	import { setAvailable } from '#lib/remote/profile.remote.ts';

	const home = $derived(await getHome());
	let copied = $state(false);

	async function copyProfileUrl() {
		await navigator.clipboard.writeText(home.profileUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>Tuis · Dorpsplein</title>
</svelte:head>

<main class="mx-auto max-w-lg space-y-8 px-4 py-10">
	<header class="flex items-center gap-4">
		<Avatar name={home.name} image={home.image} size={56} />
		<h1 class="text-2xl font-bold text-stone-900">Goeiedag, {home.firstName}!</h1>
	</header>

	{#if home.isWorker}
		<section
			class="rounded-lg border px-4 py-3 {home.available
				? 'border-green-300 bg-green-50'
				: 'border-stone-200 bg-stone-100'}"
		>
			<label class="flex items-center justify-between gap-4">
				<span>
					<span
						class="flex items-center gap-2 font-semibold {home.available
							? 'text-green-900'
							: 'text-stone-700'}"
					>
						{#if home.available}<span class="h-2.5 w-2.5 rounded-full bg-green-600"></span>{/if}
						{home.available ? 'Oop vir werk' : 'Tans nie beskikbaar nie'}
					</span>
					<span class="block text-sm text-stone-600">
						{home.available
							? 'Jy kry kennisgewings oor nuwe werk wat by jou pas.'
							: 'Skakel aan om weer kennisgewings oor werk te kry.'}
					</span>
				</span>
				<input
					type="checkbox"
					checked={home.available}
					onchange={(e) => setAvailable(e.currentTarget.checked).updates(getHome())}
					class="h-5 w-5"
				/>
			</label>
		</section>
	{:else}
		<Card>
			<h2 class="font-semibold text-stone-900">Wil jy ook werk kry?</h2>
			<p class="text-sm text-stone-600">
				Kies waaroor jy wil hoor, dan sê ons jou as iemand iets plaas wat pas.
			</p>
			<Button variant="secondary" size="sm" class="mt-3" href="/profiel#belangstellings"
				>Kies belangstellings</Button
			>
		</Card>
	{/if}

	{#if home.isWorker && home.done < home.checklist.length}
		<Card>
			<h2 class="font-semibold text-stone-900">Maak jou profiel sterker</h2>
			<p class="text-sm text-stone-600">’n Volledige profiel help werkgewers om jou te kies.</p>
			<div class="mt-3 h-2 rounded-full bg-stone-200" aria-hidden="true">
				<div
					class="h-2 rounded-full bg-stone-900"
					style:width="{(home.done / home.checklist.length) * 100}%"
				></div>
			</div>
			<p class="mt-1 text-xs text-stone-500">{home.done} van {home.checklist.length} klaar</p>
			<ul class="mt-3 space-y-1">
				{#each home.checklist as item (item.label)}
					<li class="text-sm">
						{#if item.done}
							<span class="text-stone-500 line-through">✔ {item.label}</span>
						{:else}
							<Button variant="link" class="text-stone-900" href={item.href}>○ {item.label}</Button>
						{/if}
					</li>
				{/each}
			</ul>
		</Card>
	{/if}

	{#if home.isWorker && home.publicProfile}
		<Card>
			<h2 class="font-semibold text-stone-900">Deel jou profiel</h2>
			<p class="text-sm text-stone-600">Stuur die skakel aan iemand wat dalk werk vir jou het.</p>
			<div class="mt-3 flex gap-2">
				<input
					readonly
					value={home.profileUrl}
					aria-label="Skakel na jou profiel"
					class="min-w-0 flex-1 rounded-md border-stone-300 text-sm"
				/>
				<Button size="sm" onclick={copyProfileUrl}>
					{copied ? 'Gekopieer ✓' : 'Kopieer'}
				</Button>
			</div>
		</Card>
	{/if}

	{#if home.waitingResponses > 0}
		<section class="rounded-lg border border-amber-300 bg-amber-50 p-4">
			<h2 class="font-semibold text-amber-950">
				{home.waitingResponses}
				{home.waitingResponses === 1 ? 'reaksie wag' : 'reaksies wag'} op jou besluit
			</h2>
			<Button variant="link" class="mt-2 text-sm text-amber-950" href="/plasings">
				Kyk na jou plasings
			</Button>
		</section>
	{/if}

	<Card>
		<h2 class="font-semibold text-stone-900">Geleenthede</h2>
		<p class="text-sm text-stone-600">
			{#if home.myLiveResponses > 0}
				Jy het {home.myLiveResponses}
				{home.myLiveResponses === 1 ? 'reaksie' : 'reaksies'} wat nog loop.
			{:else}
				Kyk watter werk nou beskikbaar is.
			{/if}
		</p>
		<div class="mt-3 flex gap-2">
			<Button size="sm" href="/geleenthede">Geleenthede</Button>
			<Button variant="secondary" size="sm" href="/my-reaksies">My reaksies</Button>
		</div>
	</Card>

	<Card>
		<h2 class="font-semibold text-stone-900">Jou plasings</h2>
		<p class="text-sm text-stone-600">
			{#if home.openListings === 0}
				Jy het geen oop plasings nie. Plaas werk, dan hoor mense wat by jou aanbod pas daarvan.
			{:else}
				Jy het {home.openListings} oop {home.openListings === 1 ? 'plasing' : 'plasings'}.
			{/if}
		</p>
		<div class="mt-3 flex gap-2">
			<Button size="sm" href="/plasings/nuut">Plaas werk</Button>
			<Button variant="secondary" size="sm" href="/plasings">My plasings</Button>
		</div>
	</Card>
</main>
