<script>
  export let name
  export let rubricItems
  export let radioValues
</script>

<div class="rubric-radio">
  <div class="headers">
    <span class="first-space" />
    <div class="header">Not Addressed/<br />Dissatisfactory</div>
    <div class="header">Low Adequate</div>
    <div class="header">High Adequate</div>
    <div class="header">Exceptional</div>
  </div>
  {#each rubricItems.slice(0, 4) as rubricItem, i}
    <div class={`rubricItem ${i % 2 == 0 ? 'highlight' : ''}`}>
      <span class="first-space">{rubricItem}</span>
      <input
        required
        bind:group={radioValues[i]}
        type="radio"
        name={`${name}-${rubricItem}`}
        value={1}
      />
      <input bind:group={radioValues[i]} type="radio" name={`${name}-${rubricItem}`} value={1.5} />
      <input bind:group={radioValues[i]} type="radio" name={`${name}-${rubricItem}`} value={2} />
      <input bind:group={radioValues[i]} type="radio" name={`${name}-${rubricItem}`} value={2.5} />
      <input bind:group={radioValues[i]} type="radio" name={`${name}-${rubricItem}`} value={3} />
      <input bind:group={radioValues[i]} type="radio" name={`${name}-${rubricItem}`} value={3.5} />
      <input bind:group={radioValues[i]} type="radio" name={`${name}-${rubricItem}`} value={4} />
    </div>
  {/each}
</div>

<style>
  .first-space {
    width: 310px;
  }

  .headers {
    display: flex;
    flex-direction: row;
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

  .highlight {
    background-color: #e2e2e2;
  }

  .rubricItem {
    display: flex;
    flex-direction: row;
    padding: 5px;
  }
</style>
