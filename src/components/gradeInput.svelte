<script>
	import { onMount } from 'svelte'
	import { getGradingRubricItems, sendGrade } from '../functions/frontendFetch.js'
	export let credential
	export let fetchNextApp

	const MIN_CHARS = 350

	let current_length = 0
	let radioValues = []
	let rubricItems = []
	let freeResponse = ''

	onMount(async () => {
		const res = await getGradingRubricItems()
		rubricItems = await res.json()
	})

	const onTextChange = (event) => {
		current_length = event.target.value.length
	}

	const onSubmit = async (event) => {
		event.preventDefault()
		const body = {
			radioValues,
			freeResponse
		}
		const res = await sendGrade(credential, body)
		if (res.status === 200) {
			current_length = 0
			radioValues = []
			freeResponse = ''
			fetchNextApp()
		}
	}
</script>

<h2>Grading</h2>

<div class="grading-form">
	<div class="headers">
		<span class="first-space" />
		<div class="header">Not Addressed/<br />Dissatisfactory</div>
		<div class="header">Low Adequate</div>
		<div class="header">High Adequate</div>
		<div class="header">Exceptional</div>
	</div>
	<form on:submit={onSubmit}>
		{#each rubricItems.slice(0, 4) as rubricItem, i}
			<div class={`rubricItem ${i % 2 == 0 ? 'highlight' : ''}`}>
				<span class="first-space">{rubricItem}</span>
				<input required bind:group={radioValues[i]} type="radio" name={rubricItem} value={1} />
				<input required bind:group={radioValues[i]} type="radio" name={rubricItem} value={1.5} />
				<input required bind:group={radioValues[i]} type="radio" name={rubricItem} value={2} />
				<input required bind:group={radioValues[i]} type="radio" name={rubricItem} value={2.5} />
				<input required bind:group={radioValues[i]} type="radio" name={rubricItem} value={3} />
				<input required bind:group={radioValues[i]} type="radio" name={rubricItem} value={3.5} />
				<input required bind:group={radioValues[i]} type="radio" name={rubricItem} value={4} />
			</div>
		{/each}
		<div class="free-response">
			<label
				>Please record your overall thoughts and summary of this application, including comments on
				any relevant experiences or anecdotes. If applicable, please note if/how the applicant is
				better qualified to be a Trip Leader or Crooling. Write at least 350 characters in your
				summary.
				<textarea
					minlength={MIN_CHARS}
					autocomplete="off"
					on:input={onTextChange}
					bind:value={freeResponse}
				/>
			</label>
			<div>Characters: {current_length}</div>
		</div>
		<button type="submit">Submit Grade</button>
	</form>
</div>

<style>
	.grading-form {
		border-radius: 5px;
		border-color: #00693e;
		border-style: solid;
		padding: 10px;
	}

	.grading-form > * {
		margin-top: 20px;
	}

	.first-space {
		width: 310px;
	}

	.headers {
		display: flex;
		flex-direction: row;
	}

	.rubricItem {
		display: flex;
		flex-direction: row;
		padding: 5px;
	}

	form {
		max-width: 900px;
	}

	.highlight {
		background-color: #e2e2e2;
	}

	/* The header width needs to be 2x the input */
	.header {
		width: 140px;
	}

	input[type='radio'] {
		width: 70px;
		margin: 0px;
		height: 20px;
	}

	.free-response {
		margin-top: 30px;
		width: 90%;
	}

	textarea {
		margin-top: 10px;
		margin-bottom: 10px;
		min-height: 130px;
		width: 100%;
		max-width: 800px;
	}

	button {
		margin-top: 10px;
	}
</style>
