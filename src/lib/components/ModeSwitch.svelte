<script lang="ts">
	import { AbsenceType } from '$lib/domain/types';
	import { Check } from 'lucide-svelte';

	let {
		mode,
		onModeChange
	}: {
		mode: AbsenceType | 'NEUTRAL';
		onModeChange: (m: AbsenceType | 'NEUTRAL') => void;
	} = $props();

	const modes = [
		{ id: 'NEUTRAL', label: 'Neutral / Auswahl', color: 'neutral', icon: null },
		{ id: AbsenceType.FREE, label: 'Frei', color: 'green', icon: null },
		{ id: AbsenceType.VACATION, label: 'Urlaub', color: 'blue', icon: null },
		{ id: AbsenceType.SICK, label: 'Krank', color: 'red', icon: null }
	];

	function getClass(mId: string, color: string) {
		const base = 'mode-btn';
		const active = mode === mId ? 'active' : '';
		return `${base} ${color} ${active}`;
	}
</script>

<div class="mode-switch-container">
	<div class="mode-switch">
		{#each modes as m}
			<button class={getClass(m.id, m.color)} onclick={() => onModeChange(m.id as any)}>
				<span class="label">{m.label}</span>
				{#if mode === m.id}
					<Check size={16} class="check-icon" />
				{/if}
			</button>
		{/each}
	</div>
</div>

<style lang="scss">
	.mode-switch-container {
		position: sticky;
		top: 0;
		z-index: 20;
		background: #f9fafb; /* Matches body bg */
		padding-bottom: 1rem;
		padding-top: 0.5rem;
	}

	.mode-switch {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		background: white;
		border-radius: 16px;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		overflow-x: auto;
	}

	.mode-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px solid transparent;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		min-width: fit-content;

		&:hover {
			transform: translateY(-1px);
		}

		&:active {
			transform: scale(0.98);
		}

		&.neutral {
			background: #f3f4f6;
			color: #4b5563;
			&:hover {
				background: #e5e7eb;
			}
			&.active {
				background: #374151;
				color: white;
				box-shadow: 0 4px 12px rgba(55, 65, 81, 0.3);
			}
		}

		&.green {
			background: #dcfce7;
			color: #166534;
			&:hover {
				background: #bbf7d0;
			}
			&.active {
				background: #16a34a;
				color: white;
				box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
			}
		}

		&.blue {
			background: #dbeafe;
			color: #1e40af;
			&:hover {
				background: #bfdbfe;
			}
			&.active {
				background: #2563eb;
				color: white;
				box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
			}
		}

		&.red {
			background: #fee2e2;
			color: #991b1b;
			&:hover {
				background: #fecaca;
			}
			&.active {
				background: #dc2626;
				color: white;
				box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
			}
		}
	}
</style>
