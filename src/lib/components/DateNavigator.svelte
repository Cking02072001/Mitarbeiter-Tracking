<script lang="ts">
	import { ArrowLeft, ArrowRight, Calendar } from 'lucide-svelte';
	import { format, addDays, subDays, isToday } from 'date-fns';
	import { de } from 'date-fns/locale';

	let { date, onDateChange }: { date: Date; onDateChange: (d: Date) => void } = $props();

	function prev() {
		onDateChange(subDays(date, 1));
	}

	function next() {
		onDateChange(addDays(date, 1));
	}

	function setToday() {
		onDateChange(new Date());
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.valueAsDate) {
			onDateChange(target.valueAsDate);
		}
	}
</script>

<div class="navigator">
	<button onclick={setToday} class="btn-today" disabled={isToday(date)}>Heute</button>

	<div class="controls">
		<button onclick={prev} class="btn-icon" aria-label="Vorheriger Tag">
			<ArrowLeft size={20} />
		</button>

		<div class="date-display">
			<Calendar size={18} class="icon" />
			<span class="text">{format(date, 'EEE, dd.MM.yyyy', { locale: de })}</span>
			<input
				type="date"
				class="date-input"
				value={format(date, 'yyyy-MM-dd')}
				onchange={handleInput}
			/>
		</div>

		<button onclick={next} class="btn-icon" aria-label="Nächster Tag">
			<ArrowRight size={20} />
		</button>
	</div>
</div>

<style lang="scss">
	.navigator {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		background: #fff;
		padding: 0.75rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		margin-bottom: 1rem;
	}

	.btn-today {
		font-weight: 600;
		color: #3b82f6;
		background: #eff6ff;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			background: #dbeafe;
		}

		&:disabled {
			opacity: 0.5;
			cursor: default;
		}
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: 1px solid #e5e7eb;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		color: #4b5563;
		transition: all 0.2s;

		&:hover {
			background: #f9fafb;
			border-color: #d1d5db;
		}
	}

	.date-display {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 1.125rem;
		color: #1f2937;
		padding: 0 1rem;
		min-width: 180px;
		justify-content: center;

		.icon {
			color: #6b7280;
		}
	}

	.date-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
		width: 100%;
	}
</style>
