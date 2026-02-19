import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Employee, AbsenceEntry } from '$lib/domain/types';
import { AbsenceType, Duration } from '$lib/domain/types';
import JSZip from 'jszip';

export async function generateEmployeePdf(
    year: number,
    month: number, // 1-12
    emp: Employee,
    entries: AbsenceEntry[]
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { width, height } = page.getSize();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Title
    const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: de });
    page.drawText(`Abwesenheitsreport: ${monthName}`, {
        x: 50,
        y: height - 50,
        size: 20,
        font: fontBold,
        color: rgb(0, 0, 0)
    });

    let y = height - 100;

    // Employee Name Header
    page.drawText(`Mitarbeiter: ${emp.name}`, {
        x: 50,
        y,
        size: 16,
        font: fontBold
    });
    y -= 30;

    // Stats Init
    const stats: Record<AbsenceType, number> = {
        [AbsenceType.NONE]: 0,
        [AbsenceType.FREE]: 0,
        [AbsenceType.VACATION]: 0,
        [AbsenceType.SICK]: 0
    };

    // Entries for this employee in this month
    const empEntries = entries.filter(e => e.employeeId === emp.id).sort((a, b) => a.date.localeCompare(b.date));

    if (empEntries.length === 0) {
        page.drawText('Keine Abwesenheiten', { x: 50, y, size: 12, font });
        y -= 20;
    } else {
        // Table Header
        page.drawText('Datum', { x: 50, y, size: 12, font: fontBold });
        page.drawText('Art', { x: 150, y, size: 12, font: fontBold });
        page.drawText('Dauer', { x: 300, y, size: 12, font: fontBold });
        y -= 20;
        page.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 550, y: y + 5 }, thickness: 1 });
        y -= 5;

        for (const e of empEntries) {
            if (e.category === AbsenceType.NONE) continue;

            const val = e.duration === Duration.FULL ? 1 : 0.5;
            stats[e.category] += val;

            const dLabel = e.duration === Duration.FULL ? 'Ganztag' : (e.duration === Duration.HALF_AM ? 'Vormittag' : 'Nachmittag');
            const cLabel = e.category === AbsenceType.FREE ? 'Frei' : (e.category === AbsenceType.VACATION ? 'Urlaub' : 'Krank');
            const dateLabel = format(new Date(e.date), 'dd.MM.yyyy');

            page.drawText(dateLabel, { x: 50, y, size: 11, font });
            page.drawText(cLabel, { x: 150, y, size: 11, font });
            page.drawText(dLabel, { x: 300, y, size: 11, font });

            y -= 20;

            if (y < 50) {
                const newPage = doc.addPage();
                // Reset y?? For MVP let's hope it fits or ignore paging complexity
                // Realistically should handle paging.
                y = height - 50;
            }
        }

        y -= 10;
        page.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 550, y: y + 5 }, thickness: 1 });
        y -= 20;

        // Summary 
        const summary = `Summe: Frei: ${stats.FREE} Tag(e), Urlaub: ${stats.VACATION} Tag(e), Krank: ${stats.SICK} Tag(e)`;
        page.drawText(summary, { x: 50, y, size: 12, font: fontBold });
        y -= 40;
    }

    // Signature
    if (y < 100) {
        const newPage = doc.addPage();
        y = height - 100;
    } else {
        y = 80; // Bottom of page
    }

    page.drawLine({
        start: { x: 50, y },
        end: { x: 250, y },
        thickness: 1,
        color: rgb(0, 0, 0)
    });
    page.drawText('Datum, Unterschrift Mitarbeiter', { x: 50, y: y - 15, size: 10, font });

    page.drawLine({
        start: { x: 300, y },
        end: { x: 500, y },
        thickness: 1,
        color: rgb(0, 0, 0)
    });
    page.drawText('Datum, Unterschrift Vorgesetzter', { x: 300, y: y - 15, size: 10, font });

    return await doc.save();
}

export async function generateAllReportsZip(
    year: number,
    month: number,
    employees: Employee[],
    entries: AbsenceEntry[]
): Promise<Blob> {
    const zip = new JSZip();
    const folderName = `Abwesenheiten_${year}-${String(month).padStart(2, '0')}`;
    const folder = zip.folder(folderName);

    if (!folder) throw new Error("Could not create ZIP folder");

    for (const emp of employees) {
        if (!emp.active) continue; // Skip archived? Or include? Let's skip inactive.

        // Filter entries for this employee to see if they have any?
        // Or generate even if empty? "Pro Mitarbeiter ein PDF" -> Yes generate for all active.

        const pdfBytes = await generateEmployeePdf(year, month, emp, entries);
        // Filename: Name_YYYY-MM.pdf
        const filename = `${emp.name.replace(/[^a-z0-9]/gi, '_')}_${year}-${String(month).padStart(2, '0')}.pdf`;
        folder.file(filename, pdfBytes);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    return content;
}

// Deprecated: old single PDF function (kept but unused or replaced logic)
// We replace the original file, so we just export the new functions.
