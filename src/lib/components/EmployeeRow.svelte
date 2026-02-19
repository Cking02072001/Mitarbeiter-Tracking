<script lang="ts">
	import { AbsenceType, Duration } from '$lib/domain/types';
	import type { Employee, AbsenceEntry } from '$lib/domain/types';

	let {
		employee,
		entry,
		mode,
		onToggle
	}: {
		employee: Employee;
		entry: AbsenceEntry | undefined;
		mode: AbsenceType | 'NEUTRAL';
		onToggle: (empId: string, type: AbsenceType, duration: Duration) => void;
	} = $props();

	// Computed state for display
	const status = $derived(entry?.category || AbsenceType.NONE);
	const duration = $derived(entry?.duration || Duration.FULL);

	function handleClick() {
		let nextType = status;
		let nextDuration = duration;

		if (mode !== 'NEUTRAL') {
			// Mode based toggle
			if (status !== mode) {
				// Different mode? Switch to selected mode FULL
				nextType = mode;
				nextDuration = Duration.FULL;
			} else {
				// Same mode? Cycle Durations or remove?
				// "Buttons funktionieren nicht" -> likely confused by start with HALF_AM.
				// New cycle: FULL -> HALF_AM -> HALF_PM -> NONE -> FULL ... (Wait, logic says: click toggles duration)
				// If currently NONE: -> FULL (User expects to set the mode)
				// If currently FULL: -> HALF_AM
				// If currently HALF_AM: -> HALF_PM
				// If currently HALF_PM: -> NONE
				if (duration === Duration.FULL) nextDuration = Duration.HALF_AM;
				else if (duration === Duration.HALF_AM) nextDuration = Duration.HALF_PM;
				else if (duration === Duration.HALF_PM) {
					nextType = AbsenceType.NONE; // Remove
					nextDuration = Duration.FULL; // Reset
				}
			}
		} else {
			// Neutral Cycle (Simple optimized)
			// NONE -> FREE FULL -> VACATION FULL -> SICK FULL -> NONE
			// User complained buttons don't work -> likely too many clicks to get to what they want.
			// Let's stick to simple cycle first.
			if (status === AbsenceType.NONE) {
				nextType = AbsenceType.FREE;
				nextDuration = Duration.FULL;
			} else if (status === AbsenceType.FREE) {
				nextType = AbsenceType.VACATION;
				nextDuration = Duration.FULL;
			} else if (status === AbsenceType.VACATION) {
				nextType = AbsenceType.SICK;
				nextDuration = Duration.FULL;
			} else if (status === AbsenceType.SICK) {
				nextType = AbsenceType.NONE;
			}
		}

		onToggle(employee.id, nextType, nextDuration);
	}

	// For Neutral Mode, maybe we want to allow Right Click or Long Press for details?
	// Or maybe a secondary action to cycle duration?
	// For now, let's keep it simple. If they want halves in neutral, they might need to use mode.
	// Or we add a small "Half" toggle button next to it?
	// Prompt said "buttons don't work", implies UX failure.

	function getLabel(t: AbsenceType, d: Duration) {
		if (t === AbsenceType.NONE) return '';
		const durLabel = d === Duration.FULL ? '' : d === Duration.HALF_AM ? ' ½ Vorm.' : ' ½ Nachm.';
		const typeLabel =
			t === AbsenceType.FREE ? 'Frei' : t === AbsenceType.VACATION ? 'Urlaub' : 'Krank';
		return `${typeLabel}${durLabel}`;
	}

	function getBaseClass(t: AbsenceType) {
		switch (t) {
			case AbsenceType.FREE:
				return 'state-green';
			case AbsenceType.VACATION:
				return 'state-blue';
			case AbsenceType.SICK:
				return 'state-red';
			default:
				return 'state-neutral';
		}
	}
</script>

<button
	class="employee-row {getBaseClass(status)} {entry ? 'has-entry' : ''}"
	onclick={handleClick}
>
	<div class="name-col">
		<span class="name">{employee.name}</span>
	</div>

	<div class="status-col">
		{#if status !== AbsenceType.NONE}
			<span class="status-badge">
				{getLabel(status, duration)}
			</span>
		{:else}
			<span class="placeholder">Anwesend</span>
		{/if}
	</div>
</button>

<style lang="scss">
	.employee-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 1rem 1.25rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		margin-bottom: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: left;
		position: relative;
		overflow: hidden;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		}

		&:active {
			transform: scale(0.99);
		}

		&.has-entry {
			border-width: 0;
			// border-left: 6px solid transparent;
		}

		&.state-neutral {
			// default
			.placeholder {
				color: #9ca3af;
				font-weight: 500;
				font-size: 0.9rem;
			}
		}

		&.state-green {
			background: #f0fdf4;
			// border-left-color: #16a34a;
			box-shadow: inset 0 0 0 2px #16a34a;
			.status-badge {
				background: #16a34a;
				color: white;
			}
		}

		&.state-blue {
			background: #eff6ff;
			// border-left-color: #2563eb;
			box-shadow: inset 0 0 0 2px #2563eb;
			.status-badge {
				background: #2563eb;
				color: white;
			}
		}

		&.state-red {
			background: #fef2f2;
			// border-left-color: #dc2626;
			box-shadow: inset 0 0 0 2px #dc2626;
			.status-badge {
				background: #dc2626;
				color: white;
			}
		}
	}

	.name {
		font-weight: 700;
		font-size: 1.1rem;
		color: #1f2937;
	}

	.status-badge {
		display: inline-block;
		padding: 0.35rem 0.75rem;
		border-radius: 99px;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>
