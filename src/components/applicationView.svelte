<script>
  export let application
</script>

<h2>Application</h2>
<div class="app-fields">
  {#each application as { question, response }}
    <h3>{question}</h3>
    {#if response}
      <p>{response}</p>
    {:else}
      <p class="no-response">[No response]</p>
    {/if}
  {/each}
</div>

<style>
  .app-fields {
    margin-top: 20px;

    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 20px;
    padding-right: 20px;

    border-radius: 5px;
    border-color: #00693e;
    border-style: solid;
  }

  .no-response {
    color: gray;
  }
</style>
