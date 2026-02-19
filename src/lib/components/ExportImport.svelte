<script lang="ts">
	import { dbService } from '$lib/db';
	import { appState } from '$lib/state.svelte';
	import { BackupDataSchema } from '$lib/validation/schemas';
	import { format } from 'date-fns';

	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	async function handleExport() {
		try {
			const data = await dbService.exportData();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `backup_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			success = 'Backup erfolgreich erstellt.';
			error = null;
			setTimeout(() => (success = null), 3000);
		} catch (e) {
			console.error(e);
			error = 'Fehler beim Export.';
		}
	}

	async function handleImport(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const json = JSON.parse(text);

			// Validate
			const result = BackupDataSchema.safeParse(json);
			if (!result.success) {
				throw new Error('Ungültiges Backup-Format: ' + result.error.message);
			}

			// Import
			await dbService.clearAll();
			for (const emp of result.data.employees) {
				await dbService.saveEmployee(emp);
			}
			for (const entry of result.data.entries) {
				await dbService.upsertEntry(entry);
			}

			await appState.init(); // Refresh state
			success = 'Daten erfolgreich wiederhergestellt.';
			error = null;
			setTimeout(() => (success = null), 3000);
		} catch (e: any) {
			console.error(e);
			error = e.message || 'Fehler beim Import.';
			success = null;
		} finally {
			target.value = ''; // Reset input
		}
	}
</script>

<div class="export-import">
	<h3>Backup & Restore</h3>

	<div class="actions">
		<button onclick={handleExport} class="btn-secondary">Backup herunterladen (JSON)</button>

		<label class="btn-secondary upload-btn">
			Backup wiederherstellen
			<input type="file" accept=".json" onchange={handleImport} hidden />
		</label>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}
	{#if success}
		<p class="success">{success}</p>
	{/if}
</div>

<style>
	.export-import {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}
	h3 {
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.btn-secondary {
		padding: 0.75rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		color: #374151;
		font-weight: 500;
		cursor: pointer;
		text-align: center;
		&:hover {
			background: #f9fafb;
		}
	}
	.upload-btn {
		display: block;
		cursor: pointer;
	}
	.error {
		color: #dc2626;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}
	.success {
		color: #16a34a;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}
</style>
