<script>
	import ApplicationView from '../components/applicationView.svelte'
	import GoogleButton from '../components/googleButton.svelte'
	import { fetchApplication, passApplication } from '../functions/frontendFetch.js'

	const MESSAGE_204 = 'No applications available to grade at this moment! Please try again later.'
	const MESSAGE_500 =
		'Sorry, something went wrong. Please try again, and contact doc-webadmin@dartmouth.edu if problem persists.'
	let message, application, credential
	let loading = false

	const fetchNextApp = async () => {
		// Don't second a second request if the first one is still loading
		if (loading) {
			return
		}

		// Fetch the application from the backend
		loading = true
		message = null
		if (application) {
			// Delete the existing lock if necessary
			await passApplication(credential)
		}
		const res = await fetchApplication(credential)

		if (res.status === 200) {
			const body = await res.json()
			application = body.application
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
	<p>You will need to sign in using your Dartmouth-provided Google account.</p>
	{#if !credential}
		<GoogleButton bind:credential />
	{:else}
		<button class={loading ? 'hidden' : ''} on:click={fetchNextApp}
			>{application ? 'Skip Application' : 'Get Application'}</button
		>
	{/if}

	{#if application}
		<ApplicationView {application} />
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
		padding: 20px;
	}

	h1 {
		background-color: #00693e;
		padding: 20px;
		margin: 0px;
		color: #ffffff;
	}
</style>
