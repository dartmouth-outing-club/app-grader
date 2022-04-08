<script>
	import { onDestroy, onMount } from 'svelte'
	import GoogleButton from '../components/googleButton.svelte'
	import { fetchApplication } from '../functions/frontendFetch.js'

	const MESSAGE_204 = 'No applications available to grade at this moment! Please try again later.'
	const MESSAGE_500 =
		'Sorry, something went wrong. Please try again later and contact doc-webadmin@dartmouth.edu if problem persists.'
	let message
	let application, counter, credential
	let secondsRemaining = 0
	let loading = false

	onMount(() => {
		counter = setInterval(() => {
			secondsRemaining -= 1
		}, 1000)
	})

	onDestroy(() => {
		clearInterval(counter)
	})

	const fetchNextApp = async () => {
		// Don't second a second request if the first one is still loading
		if (loading) {
			return
		}

		// Fetch the application from the backend
		loading = true
		message = null
		const res = await fetchApplication(credential)

		if (res.status === 200) {
			const body = await res.json()
			application = body.application
			secondsRemaining = body.secondsRemaining
		} else if (res.status === 204) {
			message = MESSAGE_204
		} else if (res.status === 500) {
			message = MESSAGE_500
		}

		loading = false
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
	{#if !credential}
		<GoogleButton bind:credential />
	{:else}
		<button class={loading ? 'hidden' : ''} on:click={fetchNextApp}
			>{application ? 'Pass' : 'Get Application'}</button
		>
	{/if}

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
	{#if message}
		<p>{message}</p>
	{/if}
</div>

<style>
	button {
		width: 183px;
		height: 38px;
		color: #ffffff;
		/* background-color: #ffffff; */
		/* border-style: solid; */
		background-color: #00693e;
		border-radius: 4px;
	}

	button:hover {
		background-color: #12312b;
	}

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
