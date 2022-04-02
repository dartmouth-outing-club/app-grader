<script context="module">
	// Redirect to the /grade route on load
	export async function load() {
		return {
			status: 302,
			redirect: '/grade'
		}
	}
</script>
