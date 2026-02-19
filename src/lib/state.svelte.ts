import { dbService } from './db';
import { type Employee, type AbsenceEntry, AbsenceType, Duration } from './domain/types';
import { v4 as uuidv4 } from 'uuid';

export class AppState {
    // Svelte 5 Runes
    employees = $state<Employee[]>([]);
    entries = $state<AbsenceEntry[]>([]);

    // UI State
    currentDate = $state(new Date());
    mode = $state<AbsenceType | 'NEUTRAL'>('NEUTRAL');
    toastMessage = $state<string | null>(null);

    private undoStack: Array<{ type: 'entry', data: AbsenceEntry | null, prev: AbsenceEntry | null }> = [];

    constructor() {
        // Initialize
        this.init();
    }

    async init() {
        await this.refreshEmployees();
        if (this.employees.length === 0) {
            await this.seedEmployees();
        }
        await this.refreshEntries();
    }

    async seedEmployees() {
        const names = ['Anna', 'Bernd', 'Clara', 'David', 'Emilia', 'Felix', 'Greta', 'Hannes'];
        for (let i = 0; i < names.length; i++) {
            await dbService.saveEmployee({
                id: uuidv4(),
                name: names[i],
                active: true,
                sortOrder: i
            });
        }
        await this.refreshEmployees();
    }

    async refreshEmployees() {
        this.employees = (await dbService.getEmployees()).sort((a, b) => a.sortOrder - b.sortOrder);
    }

    async refreshEntries() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        this.entries = await dbService.getEntriesByMonth(year, month);
    }

    async setDate(date: Date) {
        this.currentDate = date;
        await this.refreshEntries();
    }

    async addEntry(employeeId: string, type: AbsenceType, duration: Duration, isUndo = false) {
        const dateStr = this.currentDate.toISOString().split('T')[0];

        // Find existing for undo
        const existing = this.entries.find(e => e.employeeId === employeeId && e.date === dateStr);

        // Push to undo stack if not an undo action itself
        if (!isUndo) {
            this.undoStack.push({
                type: 'entry',
                data: type === AbsenceType.NONE ? null : {
                    id: existing?.id || uuidv4(),
                    employeeId,
                    date: dateStr,
                    category: type,
                    duration,
                    updatedAt: Date.now()
                },
                prev: existing ? { ...existing } : null
            });
            // Limit stack size
            if (this.undoStack.length > 20) this.undoStack.shift();
        }

        if (type === AbsenceType.NONE) {
            if (existing) {
                await dbService.deleteEntry(existing.id);
            }
        } else {
            const entry: AbsenceEntry = {
                id: existing?.id || uuidv4(),
                employeeId,
                date: dateStr,
                category: type,
                duration,
                updatedAt: Date.now()
            };
            await dbService.upsertEntry(entry);
        }

        await this.refreshEntries();
        this.toastMessage = 'Gespeichert';
        setTimeout(() => this.toastMessage = null, 3000);
    }

    async undo() {
        const action = this.undoStack.pop();
        if (!action) return;

        if (action.type === 'entry') {
            const prev = action.prev;
            if (prev) {
                await dbService.upsertEntry(prev);
            } else {
                // If prev was null, it means there was no entry, so we should delete whatever is there now (if we created one)
                // Wait, if we created an entry, we need to delete it.
                // We need the ID of the entry we created.
                // But we store 'data' in undo stack.
                if (action.data) {
                    // We created action.data. We should delete it.
                    // But ID might have changed? No, we use uuid.
                    // We need to match by (employeeId, date).
                    const current = this.entries.find(e => e.employeeId === action.data!.employeeId && e.date === action.data!.date);
                    if (current) await dbService.deleteEntry(current.id);
                }
            }
            await this.refreshEntries();
            this.toastMessage = 'Rückgängig gemacht';
            setTimeout(() => this.toastMessage = null, 3000);
        }
    }

    async copyFromYesterday() {
        const yesterday = new Date(this.currentDate);
        yesterday.setDate(yesterday.getDate() - 1);

        const yYear = yesterday.getFullYear();
        const yMonth = yesterday.getMonth() + 1;
        const yDayStr = yesterday.toISOString().split('T')[0];

        // We need to fetch yesterday's entries. 
        // Optimization: fetches whole month of yesterday.
        const yEntriesAll = await dbService.getEntriesByMonth(yYear, yMonth);
        const yEntries = yEntriesAll.filter(e => e.date === yDayStr);

        if (yEntries.length === 0) {
            this.toastMessage = 'Keine Einträge von gestern gefunden';
            setTimeout(() => this.toastMessage = null, 3000);
            return;
        }

        const todayStr = this.currentDate.toISOString().split('T')[0];

        for (const emp of this.employees) {
            const yEntry = yEntries.find(e => e.employeeId === emp.id);
            if (yEntry) {
                // Create copy for today
                // Check if today already has entry? 
                // "Kopiert alle Einträge vom Vortag" -> likely overwrite or fill blank?
                // Assuming overwrite is safer or requested behavior.
                await dbService.upsertEntry({
                    id: uuidv4(),
                    employeeId: emp.id,
                    date: todayStr,
                    category: yEntry.category,
                    duration: yEntry.duration,
                    updatedAt: Date.now()
                });
            } else {
                // If employee had NO entry yesterday (was "Da"), should we delete today's entry?
                // Logic: "Copy from yesterday" implies making today look like yesterday.
                // So yes, we should clear today's entry for this employee.
                const tEntry = this.entries.find(e => e.employeeId === emp.id && e.date === todayStr);
                if (tEntry) {
                    await dbService.deleteEntry(tEntry.id);
                }
            }
        }

        await this.refreshEntries();
        this.toastMessage = 'Von gestern kopiert';
        setTimeout(() => this.toastMessage = null, 3000);
    }
}

export const appState = new AppState();
