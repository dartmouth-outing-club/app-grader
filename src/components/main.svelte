<script>
	import { onDestroy, onMount } from 'svelte'

	import ApplicationView from '../components/applicationView.svelte'
	import GoogleButton from '../components/googleButton.svelte'
	import GradeInput from './gradeInput.svelte'
	import Timer from './timer.svelte'
	import { fetchApplication, passApplication } from '../functions/frontendFetch.js'
	import { isCrooApp, isLeaderApp } from '../functions/trips.js'

	const MESSAGE_204 = 'No applications available to grade at this moment! Please try again later.'
	const MESSAGE_500 =
		'Sorry, something went wrong. Please try again, and contact doc-webadmin@dartmouth.edu if problem persists.'
	const MESSAGE_EXPIRED = 'Application expired. Please fetch a new one.'

	let message, application, credential, timer
	let secondsRemaining = -1
	let loading = false

	$: leader = isLeaderApp(application)
	$: croo = isCrooApp(application)

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
			secondsRemaining = body.secondsRemaining
		} else if (res.status === 204) {
			message = MESSAGE_204
			application = null
		} else if (res.status === 403) {
			credential = null
			application = null
		} else if (res.status === 500) {
			message = MESSAGE_500
			application = null
		}

		document.body.scrollIntoView()
		loading = false
	}

	onMount(() => {
		timer = setInterval(() => {
			secondsRemaining -= 1
			if (secondsRemaining === 0) {
				application = null
				message = MESSAGE_EXPIRED
			}
		}, 1000)
	})

	onDestroy(() => {
		clearInterval(timer)
	})
</script>

<h1>First-Year Trips Application Grader</h1>
<div class="content">
	<p>
		Thank you so much for volunteering to grade First-Year Trips applications! Trips wouldn't be
		possible without you :)
	</p>
	<p>
		While the applications are anonymous, if you recoginize the applicant based on what they wrote,
		please click the "skip" button to move on to the next application. Please feel free to refer to
		the <a
			href="https://docs.google.com/spreadsheets/d/1hSBEwEzFBBBkdl__2ZOc7VC7UKfGumBeQWbBO__ZpJI/edit?usp=sharing"
			>the grading rubric</a
		>
		and
		<a
			href="https://docs.google.com/document/d/1g27UScm2uL87dXYcKToJmlKpiNkxqf9uv8Rc4gyZpGQ/edit?usp=sharing"
			>the training materials</a
		> at any time while grading.
	</p>
	{#if !credential}
		<p>You will need to sign in using your Dartmouth-provided Google account.</p>
		<GoogleButton bind:credential />
	{:else}
		<button class={loading ? 'hidden' : ''} on:click={fetchNextApp}
			>{application ? 'Skip Application' : 'Get Application'}</button
		>
	{/if}

	{#if message}
		<h3>{message}</h3>
	{/if}

	{#if application}
		<Timer {secondsRemaining} />
		<ApplicationView {application} />
		<GradeInput bind:credential {fetchNextApp} {leader} {croo} />
	{/if}
</div>

<style>
	a:visited {
		text-decoration: none;
		color: #9d162e;
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
