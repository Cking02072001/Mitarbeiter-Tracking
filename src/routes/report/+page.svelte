<script lang="ts">
	import { appState } from '$lib/state.svelte';
	import { generateAllReportsZip } from '$lib/report/pdf';
	import { dbService } from '$lib/db';
	import { format } from 'date-fns';
	import { de } from 'date-fns/locale';
	import ExportImport from '$lib/components/ExportImport.svelte';
	import { Loader2 } from 'lucide-svelte';
	import { base } from '$app/paths';

	let month = $state(new Date().getMonth() + 1);
	let year = $state(new Date().getFullYear());
	let loading = $state(false);

	const months = Array.from({ length: 12 }, (_, i) => ({
		value: i + 1,
		label: format(new Date(2000, i, 1), 'MMMM', { locale: de })
	}));

	async function downloadZip() {
		loading = true;
		try {
			const entries = await dbService.getEntriesByMonth(year, month);
			const employees = await dbService.getEmployees();

			const blob = await generateAllReportsZip(year, month, employees, entries);

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `Abwesenheiten_${year}-${String(month).padStart(2, '0')}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error(e);
			alert('Fehler beim Erstellen des ZIP-Archivs');
		} finally {
			loading = false;
		}
	}
</script>

<div class="report-page">
	<header>
		<a href="{base}/" class="back-link">← Zurück</a>
		<h1>Report erstellen</h1>
	</header>

	<div class="card">
		<div class="form-group">
			<label for="month">Monat</label>
			<select id="month" bind:value={month}>
				{#each months as m}
					<option value={m.value}>{m.label}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label for="year">Jahr</label>
			<input type="number" id="year" bind:value={year} />
		</div>

		<button onclick={downloadZip} disabled={loading} class="btn-primary">
			{#if loading}
				<Loader2 class="animate-spin" size={20} /> Generiere...
			{:else}
				ZIP Herunterladen (Alle Mitarbeiter)
			{/if}
		</button>

		<ExportImport />
	</div>
</div>

<style lang="scss">
	.report-page {
		padding: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}
	header {
		margin-bottom: 2rem;
		.back-link {
			font-weight: 500;
			color: #6b7280;
			margin-bottom: 0.5rem;
			display: block;
		}
	}
	.card {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	.form-group {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	label {
		font-weight: 500;
		color: #374151;
	}
	select,
	input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		background: #fff;
	}
	.btn-primary {
		width: 100%;
		padding: 1rem;
		background: #2563eb;
		color: white;
		font-weight: 600;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.2s;

		&:hover {
			background: #1d4ed8;
		}
		&:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}

		:global(.animate-spin) {
			animation: spin 1s linear infinite;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
