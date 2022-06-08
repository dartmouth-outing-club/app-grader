<script>
  export let secondsRemaining

  $: time =
    secondsRemaining > 60
      ? `${Math.floor(secondsRemaining / 60)} minutes`
      : `${secondsRemaining} seconds`
</script>

<h2>Time Remaining</h2>
<p>You have {time} left to view the application.</p>
