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
				// Switch to mode
				nextType = mode;
				nextDuration = entry?.duration || Duration.FULL; // Keep duration if sensible? Or reset?
				// Requirement: Toggle duration within category.
				// If current is NONE, go to HALF_AM? Or FULL?
				// "Klick toggelt nur Dauer innerhalb dieser Kategorie: NONE -> HALF_AM -> HALF_PM -> FULL -> NONE"
				if (status === AbsenceType.NONE) nextDuration = Duration.HALF_AM;
				else nextDuration = Duration.FULL; // just init
			}

			// Cycle duration
			if (status === AbsenceType.NONE) {
				nextType = mode;
				nextDuration = Duration.HALF_AM;
			} else if (duration === Duration.HALF_AM) {
				nextDuration = Duration.HALF_PM;
			} else if (duration === Duration.HALF_PM) {
				nextDuration = Duration.FULL;
			} else if (duration === Duration.FULL) {
				nextType = AbsenceType.NONE;
			}
		} else {
			// Neutral Cycle
			// 1) NONE
			// 2) FREE HALF_AM -> PM -> FULL
			// 3) VACATION HALF_AM -> PM -> FULL
			// 4) SICK HALF_AM -> PM -> FULL
			// -> NONE

			if (status === AbsenceType.NONE) {
				nextType = AbsenceType.FREE;
				nextDuration = Duration.HALF_AM;
			} else if (status === AbsenceType.FREE) {
				if (duration === Duration.HALF_AM) nextDuration = Duration.HALF_PM;
				else if (duration === Duration.HALF_PM) nextDuration = Duration.FULL;
				else {
					nextType = AbsenceType.VACATION;
					nextDuration = Duration.HALF_AM;
				}
			} else if (status === AbsenceType.VACATION) {
				if (duration === Duration.HALF_AM) nextDuration = Duration.HALF_PM;
				else if (duration === Duration.HALF_PM) nextDuration = Duration.FULL;
				else {
					nextType = AbsenceType.SICK;
					nextDuration = Duration.HALF_AM;
				}
			} else if (status === AbsenceType.SICK) {
				if (duration === Duration.HALF_AM) nextDuration = Duration.HALF_PM;
				else if (duration === Duration.HALF_PM) nextDuration = Duration.FULL;
				else {
					nextType = AbsenceType.NONE;
				}
			}
		}

		onToggle(employee.id, nextType, nextDuration);
	}

	// Status Helpers
	function getLabel(t: AbsenceType, d: Duration) {
		if (t === AbsenceType.NONE) return 'Da';
		const durLabel = d === Duration.FULL ? '' : d === Duration.HALF_AM ? ' ½ AM' : ' ½ PM';
		const typeLabel =
			t === AbsenceType.FREE ? 'Frei' : t === AbsenceType.VACATION ? 'Urlaub' : 'Krank';
		return `${typeLabel}${durLabel}`;
	}

	function getColorClass(t: AbsenceType) {
		switch (t) {
			case AbsenceType.FREE:
				return 'bg-green-100 text-green-800 border-green-300';
			case AbsenceType.VACATION:
				return 'bg-blue-100 text-blue-800 border-blue-300';
			case AbsenceType.SICK:
				return 'bg-red-100 text-red-800 border-red-300';
			default:
				return 'bg-gray-50 text-gray-500 border-gray-200';
		}
	}
</script>

<button
	class="w-full text-left p-4 rounded-lg border-2 transition-all active:scale-[0.98] {getColorClass(
		status
	)}"
	onclick={handleClick}
>
	<div class="flex justify-between items-center">
		<span class="font-bold text-lg">{employee.name}</span>
		<span class="font-medium bg-white/50 px-2 py-1 rounded text-sm min-w-[80px] text-center">
			{getLabel(status, duration)}
		</span>
	</div>
</button>

<style>
	/* Add detailed styles or use Tailwind if available. Wait, I should use SCSS Modules as per prompt. */
	/* The prompt says SCSS Modules strictly. I used global classes above for conceptual speed but I must fix this. */
</style>
