<script lang="ts">
	import { AbsenceType } from '$lib/domain/types';

	let {
		mode,
		onModeChange
	}: {
		mode: AbsenceType | 'NEUTRAL';
		onModeChange: (m: AbsenceType | 'NEUTRAL') => void;
	} = $props();

	const modes = [
		{ id: 'NEUTRAL', label: 'Neutral', color: 'bg-gray-100 text-gray-700' },
		{ id: AbsenceType.FREE, label: 'Frei', color: 'bg-green-100 text-green-800' },
		{ id: AbsenceType.VACATION, label: 'Urlaub', color: 'bg-blue-100 text-blue-800' },
		{ id: AbsenceType.SICK, label: 'Krank', color: 'bg-red-100 text-red-800' }
	];
</script>

<div class="mode-switch">
	{#each modes as m}
		<button
			class="mode-btn {m.color}"
			class:active={mode === m.id}
			onclick={() => onModeChange(m.id as any)}
		>
			{m.label}
		</button>
	{/each}
</div>

<style lang="scss">
	.mode-switch {
		display: flex;
		gap: 0.5rem;
		padding: 0.25rem;
		background: #f3f4f6;
		border-radius: 12px;
		margin-bottom: 1rem;
		overflow-x: auto;
	}

	.mode-btn {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid transparent;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;

		&:hover {
			filter: brightness(0.95);
		}

		&.active {
			border-color: currentColor;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			transform: scale(1.02);
		}
	}
</style>
