<script>
	export let application
</script>

<div class="app-fields">
	<h2>Application</h2>
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

	.app-fields h2 {
		margin-top: 10px;
	}

	.no-response {
		color: gray;
	}
</style>
