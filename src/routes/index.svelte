<script>
	import { onMount } from 'svelte'

	let sheetData

	onMount(async () => {
		const res = await fetch('/api/application')
		const json = await res.json()
		sheetData = JSON.stringify(json)
	})
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<p>{sheetData || 'no data'}</p>
