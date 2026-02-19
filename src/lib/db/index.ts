import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AbsenceEntry, Employee } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

interface AppDB extends DBSchema {
    employees: {
        key: string;
        value: Employee;
        indexes: { 'by-active': boolean };
    };
    entries: {
        key: string;
        value: AbsenceEntry;
        indexes: {
            'by-employee': string;
            'by-date': string;
            'by-employee-date': [string, string];
        };
    };
}

const DB_NAME = 'absence-manager-db';
const DB_VERSION = 1;

class DatabaseService {
    private dbPromise: Promise<IDBPDatabase<AppDB>>;

    constructor() {
        if (typeof window === 'undefined') {
            this.dbPromise = new Promise(() => { }); // Never resolves on server
            return;
        }
        this.dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const employeeStore = db.createObjectStore('employees', { keyPath: 'id' });
                employeeStore.createIndex('by-active', 'active');

                const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
                entryStore.createIndex('by-employee', 'employeeId');
                entryStore.createIndex('by-date', 'date');
                entryStore.createIndex('by-employee-date', ['employeeId', 'date'], { unique: true });
            }
        });
    }

    async getEmployees(): Promise<Employee[]> {
        const db = await this.dbPromise;
        return db.getAll('employees');
    }

    async saveEmployee(employee: Employee): Promise<void> {
        const db = await this.dbPromise;
        await db.put('employees', employee);
    }

    async deleteEmployee(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('employees', id);
    }

    async getEntriesByMonth(year: number, month: number): Promise<AbsenceEntry[]> {
        const db = await this.dbPromise;
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        // Calculate last day of month
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
        const range = IDBKeyRange.bound(start, end);
        return db.getAllFromIndex('entries', 'by-date', range);
    }

    async getEntry(employeeId: string, date: string): Promise<AbsenceEntry | undefined> {
        const db = await this.dbPromise;
        return db.getFromIndex('entries', 'by-employee-date', [employeeId, date]);
    }

    async upsertEntry(entry: AbsenceEntry): Promise<void> {
        const db = await this.dbPromise;
        // Check for existing entry with same employee and date
        const existing = await db.getFromIndex('entries', 'by-employee-date', [entry.employeeId, entry.date]);
        if (existing && existing.id !== entry.id) {
            // If existing found with different ID, use the existing ID to overwrite
            entry.id = existing.id;
        }
        await db.put('entries', entry);
    }

    async deleteEntry(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('entries', id);
    }

    async exportData() {
        const db = await this.dbPromise;
        const employees = await db.getAll('employees');
        const entries = await db.getAll('entries');
        return {
            employees,
            entries,
            meta: {
                version: '1.0',
                exportedAt: Date.now()
            }
        };
    }

    async clearAll() {
        const db = await this.dbPromise;
        await db.clear('employees');
        await db.clear('entries');
    }
}

export const dbService = new DatabaseService();
