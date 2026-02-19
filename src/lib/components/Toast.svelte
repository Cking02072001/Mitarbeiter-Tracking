<script lang="ts">
	let { message, onUndo }: { message: string | null; onUndo: () => void } = $props();
</script>

{#if message}
	<div class="toast">
		<span>{message}</span>
		{#if message === 'Gespeichert'}
			<button onclick={onUndo} class="undo-btn">Rückgängig</button>
		{/if}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: #1f2937;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 99px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 1rem;
		animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		z-index: 100;
	}

	.undo-btn {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 99px;
		font-size: 0.875rem;
		cursor: pointer;

		&:hover {
			background: rgba(255, 255, 255, 0.1);
		}
	}

	@keyframes slideUp {
		from {
			transform: translate(-50%, 100%);
			opacity: 0;
		}
		to {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}
</style>
