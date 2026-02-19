export enum AbsenceType {
    NONE = 'NONE',
    FREE = 'FREE',
    VACATION = 'VACATION',
    SICK = 'SICK'
}

export enum Duration {
    FULL = 'FULL',
    HALF_AM = 'HALF_AM',
    HALF_PM = 'HALF_PM'
}

export interface Employee {
    id: string;
    name: string;
    active: boolean;
    sortOrder: number;
}

export interface AbsenceEntry {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    category: AbsenceType;
    duration: Duration;
    note?: string;
    updatedAt: number;
}

export interface BackupData {
    employees: Employee[];
    entries: AbsenceEntry[];
    meta: {
        version: string;
        exportedAt: number;
    };
}
