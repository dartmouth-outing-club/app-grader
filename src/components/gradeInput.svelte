<script>
  import { onMount } from 'svelte'
  import { getGradingRubricItems, sendGrade } from '../functions/frontendFetch.js'
  import RubricRadio from './rubricRadio.svelte'
  export let credential
  export let fetchNextApp
  export let leader
  export let croo

  let current_length = 0
  let rubricItems = []
  let leaderRubric = []
  let crooRubric = []
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

    if (current_length < 350) {
      alert('Please enter a response of at least 350 characters.')
      return
    }

    const body = {
      leaderRubric,
      crooRubric,
      freeResponse
    }
    const res = await sendGrade(credential, body)
    if (res.status === 200) {
      current_length = 0
      leaderRubric = []
      crooRubric = []
      freeResponse = ''
      alert('Grade submitted!')
      fetchNextApp()
    }
    // TODO better API failure response
  }
</script>

<h2>Grading</h2>

<div class="grading-form">
  <form on:submit={onSubmit}>
    {#if leader}
      <h3>Leader rubric</h3>
      <RubricRadio name="leader" {rubricItems} radioValues={leaderRubric} />
    {/if}
    {#if croo}
      <h3>Croo rubric</h3>
      <RubricRadio name="croo" {rubricItems} radioValues={crooRubric} />
    {/if}
    <div class="free-response">
      <label
        >Please record your overall thoughts and summary of this application, including comments on
        any relevant experiences or anecdotes. If applicable, please note if/how the applicant is
        better qualified to be a Trip Leader or Crooling. Write at least 350 characters in your
        summary.
        <textarea required autocomplete="off" on:input={onTextChange} bind:value={freeResponse} />
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

  form {
    max-width: 900px;
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
