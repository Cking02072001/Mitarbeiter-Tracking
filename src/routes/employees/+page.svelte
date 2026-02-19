<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import { dbService } from '$lib/db';
	import { type Employee } from '$lib/domain/types';
	import { v4 as uuidv4 } from 'uuid';
	import { base } from '$app/paths';

	let newName = $state('');

	async function addEmployee() {
		if (!newName.trim()) return;
		const nextOrder = appState.employees.length;
		await dbService.saveEmployee({
			id: uuidv4(),
			name: newName.trim(),
			active: true,
			sortOrder: nextOrder
		});
		newName = '';
		await appState.refreshEmployees();
	}

	async function toggleActive(emp: Employee) {
		emp.active = !emp.active;
		await dbService.saveEmployee(JSON.parse(JSON.stringify(emp))); // Clone to avoid proxy issues with IDB? Svelte 5 proxies should be fine but careful.
		await appState.refreshEmployees();
	}

	async function move(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index === 0) return;
		if (direction === 'down' && index === appState.employees.length - 1) return;

		const emp1 = appState.employees[index];
		const emp2 = appState.employees[direction === 'up' ? index - 1 : index + 1];

		// Swap orders
		const temp = emp1.sortOrder;
		emp1.sortOrder = emp2.sortOrder;
		emp2.sortOrder = temp;

		await dbService.saveEmployee(JSON.parse(JSON.stringify(emp1)));
		await dbService.saveEmployee(JSON.parse(JSON.stringify(emp2)));
		await appState.refreshEmployees();
	}

	async function updateName(emp: Employee, e: Event) {
		const target = e.target as HTMLInputElement;
		emp.name = target.value;
		await dbService.saveEmployee(JSON.parse(JSON.stringify(emp)));
	}
</script>

<div class="employees-page">
	<header>
		<a href="{base}/">← Zurück</a>
		<h1>Mitarbeiter verwalten</h1>
	</header>

	<div class="card">
		<div class="add-form">
			<input
				type="text"
				placeholder="Neuer Mitarbeiter Name"
				bind:value={newName}
				onkeydown={(e) => e.key === 'Enter' && addEmployee()}
			/>
			<button onclick={addEmployee} class="btn-primary">Hinzufügen</button>
		</div>

		<ul class="list">
			{#each appState.employees as emp, i (emp.id)}
				<li class="item" class:inactive={!emp.active}>
					<input
						type="text"
						value={emp.name}
						onchange={(e) => updateName(emp, e)}
						class="name-input"
					/>

					<div class="actions">
						<button class="icon-btn" onclick={() => move(i, 'up')} disabled={i === 0}>↑</button>
						<button
							class="icon-btn"
							onclick={() => move(i, 'down')}
							disabled={i === appState.employees.length - 1}>↓</button
						>

						<button class="toggle-btn" class:active={emp.active} onclick={() => toggleActive(emp)}>
							{emp.active ? 'Aktiv' : 'Archiviert'}
						</button>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.employees-page {
		padding: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}
	header {
		margin-bottom: 2rem;
	}
	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	.add-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
	}
	.btn-primary {
		padding: 0.5rem 1rem;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f3f4f6;

		&.inactive {
			opacity: 0.6;
		}
	}
	.name-input {
		border: none;
		background: transparent;
		font-weight: 500;
		width: 100%;
		&:focus {
			outline: 1px solid #2563eb;
			background: white;
		}
	}
	.actions {
		display: flex;
		gap: 0.25rem;
	}
	.icon-btn {
		background: #f3f4f6;
		border: none;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		&:hover {
			background: #e5e7eb;
		}
		&:disabled {
			opacity: 0.3;
			cursor: default;
		}
	}
	.toggle-btn {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid #d1d5db;
		background: white;
		cursor: pointer;
		width: 70px;

		&.active {
			background: #dbeafe;
			color: #1e40af;
			border-color: #bfdbfe;
		}
	}
</style>
