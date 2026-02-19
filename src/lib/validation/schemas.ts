import { z } from 'zod';
import { AbsenceType, Duration } from '../domain/types';

export const EmployeeSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    active: z.boolean(),
    sortOrder: z.number().int()
});

export const AbsenceEntrySchema = z.object({
    id: z.string().uuid(),
    employeeId: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.nativeEnum(AbsenceType),
    duration: z.nativeEnum(Duration),
    note: z.string().optional(),
    updatedAt: z.number()
});

export const BackupDataSchema = z.object({
    employees: z.array(EmployeeSchema),
    entries: z.array(AbsenceEntrySchema),
    meta: z.object({
        version: z.string(),
        exportedAt: z.number()
    })
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;
export type AbsenceEntryInput = z.infer<typeof AbsenceEntrySchema>;
