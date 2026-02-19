<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import EmployeeRow from '$lib/components/EmployeeRow.svelte';
	import DateNavigator from '$lib/components/DateNavigator.svelte';
	import ModeSwitch from '$lib/components/ModeSwitch.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { AbsenceType, Duration } from '$lib/domain/types';

	// Helper to get entry for employee
	function getEntry(acc: any, empId: string) {
		const entry = appState.entries.find(
			(e) => e.employeeId === empId && e.date === appState.currentDate.toISOString().split('T')[0]
		);
		return entry;
	}
</script>

<div class="container">
	<header class="header">
		<h1>Abwesenheiten</h1>
		<div class="actions">
			<button onclick={() => appState.copyFromYesterday()} class="btn-secondary">
				Von gestern kopieren
			</button>
			<!-- Navigation Links could go here or in a sidebar/menu -->
			<nav>
				<a href="/month" class="nav-link">Monat</a>
				<a href="/report" class="nav-link">Report</a>
				<a href="/employees" class="nav-link">Mitarbeiter</a>
			</nav>
		</div>
	</header>

	<DateNavigator date={appState.currentDate} onDateChange={(d) => appState.setDate(d)} />

	<ModeSwitch mode={appState.mode} onModeChange={(m) => (appState.mode = m)} />

	<div class="employee-list">
		{#each appState.employees as employee (employee.id)}
			{@const entry = appState.entries.find(
				(e) =>
					e.employeeId === employee.id &&
					e.date === appState.currentDate.toISOString().split('T')[0]
			)}
			<EmployeeRow
				{employee}
				{entry}
				mode={appState.mode}
				onToggle={(id, type, duration) => appState.addEntry(id, type, duration)}
			/>
		{/each}
	</div>

	<Toast message={appState.toastMessage} onUndo={() => appState.undo()} />
</div>

<style lang="scss">
	:global(body) {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
		background: #f9fafb;
		margin: 0;
		color: #111827;
	}

	.container {
		max-width: 600px; /* Mobile optimized width */
		margin: 0 auto;
		padding: 1rem;
		min-height: 100vh;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;

		h1 {
			font-size: 1.5rem;
			font-weight: 700;
		}
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.nav-link {
		color: #4b5563;
		text-decoration: none;
		font-weight: 500;
		&:hover {
			text-decoration: underline;
		}
	}

	.btn-secondary {
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		color: #374151;
		cursor: pointer;
		&:hover {
			background: #f3f4f6;
		}
	}

	.employee-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
