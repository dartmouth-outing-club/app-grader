<script>
	import { onDestroy, onMount } from 'svelte'

	let application, counter
	let secondsRemaining = 0

	onMount(() => {
		counter = setInterval(() => {
			secondsRemaining -= 1
		}, 1000)
	})

	onDestroy(() => {
		clearInterval(counter)
	})

	const fetchNextApp = async () => {
		// Fetch the application from the backend
		const res = await fetch('/api/applications')
		const sheetData = await res.json()
		application = sheetData.application

		// Decrement the seconds-remaining counter every second
		secondsRemaining = sheetData.secondsRemaining
	}
</script>

<h1>DOC Trips Application Grader</h1>
<div class="content">
	<p>
		Thank you so much for volunteering to grade DOC First Year Trips applications! Trips wouldn't be
		possible without you.
	</p>
	<p>
		Each application is held for you for 20 minutes. While the applications are anonymous, if you
		recoginize the applicant based on what they wrote, please click the "skip" button to move on to
		the next application.
	</p>
	<button on:click={fetchNextApp}>{application ? 'Pass' : 'Get Application'}</button>
	{#if application}
		<h3>Time remaining</h3>
		<p>You have {secondsRemaining} seconds remaining</p>
		<div class="app-fields">
			<h2>Application</h2>
			{#each application as appField}
				<h3>{appField.question}</h3>
				<p>{appField.response}</p>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* https://communications.dartmouth.edu/visual-identity/design-elements/color-palette */
	:global(body) {
		background-color: #ffffff;
		margin: 0px;
		padding: 0px;
	}

	.content {
		padding: 10px;
	}

	h1 {
		background-color: #00693e;
		padding: 20px;
		margin: 0px;
		color: #ffffff;
	}

	.app-fields {
		padding-top: 5px;
		padding-bottom: 5px;
		padding-left: 20px;
		padding-right: 20px;

		border-radius: 5px;
		border-color: #00693e;
		border-style: solid;
	}

	.app-fields h2 {
		margin-top: 10px;
	}
</style>
