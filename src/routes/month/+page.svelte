<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import { format, getDaysInMonth, startOfMonth } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { AbsenceType, Duration } from '$lib/domain/types';
	import { dbService } from '$lib/db';
	import { v4 as uuidv4 } from 'uuid';
	import { base } from '$app/paths';

	let month = $state(new Date().getMonth());
	let year = $state(new Date().getFullYear());

	const months = Array.from({ length: 12 }, (_, i) => {
		return format(new Date(2000, i, 1), 'MMMM', { locale: de });
	});

	function daysInMonth(y: number, m: number) {
		return new Date(y, m + 1, 0).getDate();
	}

	function getDayLabels(y: number, m: number) {
		const days = daysInMonth(y, m);
		return Array.from({ length: days }, (_, i) => i + 1);
	}

	function getWeekdayLabel(y: number, m: number, d: number) {
		return format(new Date(y, m, d), 'EE', { locale: de });
	}

	async function load() {
		const entries = await dbService.getEntriesByMonth(year, month + 1);
		appState.entries = entries;
		appState.setDate(new Date(year, month, 1));
	}

	$effect(() => {
		load();
	});

	function getEntry(empId: string, d: number) {
		const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		return appState.entries.find((e) => e.employeeId === empId && e.date === dateStr);
	}

	async function handleCellClick(empId: string, d: number) {
		const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		const entry = getEntry(empId, d);

		let nextType = AbsenceType.FREE;
		let nextDuration = Duration.FULL;

		if (appState.mode !== 'NEUTRAL') {
			if (entry?.category === appState.mode) {
				if (entry.duration === Duration.FULL) nextType = AbsenceType.NONE;
				else if (entry.duration === Duration.HALF_AM) nextDuration = Duration.HALF_PM;
				else if (entry.duration === Duration.HALF_PM) nextDuration = Duration.FULL;
				else nextDuration = Duration.HALF_AM;

				if (nextType !== AbsenceType.NONE) nextType = appState.mode;
			} else {
				nextType = appState.mode;
				nextDuration = Duration.FULL;
			}
		} else {
			if (!entry) {
				nextType = AbsenceType.FREE;
			} else if (entry.category === AbsenceType.FREE) {
				nextType = AbsenceType.VACATION;
			} else if (entry.category === AbsenceType.VACATION) {
				nextType = AbsenceType.SICK;
			} else if (entry.category === AbsenceType.SICK) {
				nextType = AbsenceType.NONE;
			}
		}

		if (nextType === AbsenceType.NONE) {
			if (entry) await dbService.deleteEntry(entry.id);
		} else {
			await dbService.upsertEntry({
				id: entry?.id || uuidv4(),
				employeeId: empId,
				date: dateStr,
				category: nextType,
				duration: nextDuration,
				updatedAt: Date.now()
			});
		}
		load();
	}

	function getCellClass(entry: any) {
		if (!entry) return 'bg-white';
		switch (entry.category) {
			case AbsenceType.FREE:
				return 'bg-green-200';
			case AbsenceType.VACATION:
				return 'bg-blue-200';
			case AbsenceType.SICK:
				return 'bg-red-200';
			default:
				return 'bg-white';
		}
	}

	function getCellText(entry: any) {
		if (!entry) return '';
		if (entry.duration === Duration.FULL) return 'X';
		if (entry.duration === Duration.HALF_AM) return '½';
		if (entry.duration === Duration.HALF_PM) return '½';
		return '';
	}
</script>

<div class="month-view">
	<header>
		<div class="header-left">
			<a href="{base}/" class="back-link">← Zurück</a>
			<h1>Monatsansicht</h1>
		</div>
		<div class="controls">
			<select bind:value={month} onchange={load}>
				{#each months as m, i}
					<option value={i}>{m}</option>
				{/each}
			</select>
			<input type="number" bind:value={year} onchange={load} class="year-input" />
		</div>
	</header>

	<div class="grid-container">
		<table class="grid">
			<thead>
				<tr>
					<th class="sticky-col">Mitarbeiter</th>
					{#each getDayLabels(year, month) as d}
						<th class:weekend={['Sa', 'So'].includes(getWeekdayLabel(year, month, d))}>
							<div class="th-content">
								<span class="weekday">{getWeekdayLabel(year, month, d)}</span>
								<span class="day-num">{d}</span>
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each appState.employees as emp}
					<tr>
						<td class="sticky-col">{emp.name}</td>
						{#each getDayLabels(year, month) as d}
							{@const entry = getEntry(emp.id, d)}
							<td class="cell {getCellClass(entry)}" onclick={() => handleCellClick(emp.id, d)}>
								{getCellText(entry)}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.month-view {
		padding: 1rem;
		max-width: 100%;
		overflow-x: hidden;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		h1 {
			margin: 0;
			font-size: 1.25rem;
		}
	}
	.controls {
		display: flex;
		gap: 0.5rem;
	}
	select,
	input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
	}
	.grid-container {
		overflow-x: auto;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: white;
	}
	.grid {
		border-collapse: separate;
		border-spacing: 0;
		width: 100%;
		font-size: 0.875rem;
	}
	th,
	td {
		border-bottom: 1px solid #e5e7eb;
		border-right: 1px solid #e5e7eb;
		padding: 0;
		text-align: center;
		min-width: 32px;
		height: 32px;
		cursor: pointer;
		white-space: nowrap;
	}
	.sticky-col {
		position: sticky;
		left: 0;
		background: white;
		z-index: 10;
		text-align: left;
		padding-left: 0.5rem;
		font-weight: 600;
		min-width: 120px;
		border-right: 2px solid #e5e7eb;
	}

	.th-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1.1;
		padding: 2px 0;
	}
	.weekday {
		font-size: 0.7rem;
		text-transform: uppercase;
		color: #6b7280;
	}
	.day-num {
		font-size: 0.9rem;
		font-weight: 600;
	}
	th.weekend {
		background-color: #f9fafb;
		color: #ef4444; /* Highlight weekends slightly */
	}

	.cell {
		transition: background 0.1s;
		&:hover {
			filter: brightness(0.95);
		}
	}

	.bg-green-200 {
		background: #bbf7d0;
		color: #166534;
	}
	.bg-blue-200 {
		background: #bfdbfe;
		color: #1e40af;
	}
	.bg-red-200 {
		background: #fecaca;
		color: #991b1b;
	}
</style>
