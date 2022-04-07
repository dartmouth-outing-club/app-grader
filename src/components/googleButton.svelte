<script>
	// @ts-nocheck
	import { onMount } from 'svelte'
	export let credential

	function handleCredentialResponse(response) {
		credential = response.credential
	}
	onMount(() => {
		// The "google" variable is populated by a script in app.html
		google.accounts.id.initialize({
			client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
			callback: handleCredentialResponse
		})
		google.accounts.id.renderButton(
			document.getElementById('buttonDiv'),
			{ theme: 'outline', size: 'large' } // customization attributes
		)
		google.accounts.id.prompt() // also display the One Tap dialog
	})
</script>

<div id="buttonDiv" />

<style>
	#buttonDiv {
		width: 200px;
	}
</style>
