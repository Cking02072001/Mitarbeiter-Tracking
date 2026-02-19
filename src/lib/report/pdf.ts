import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Employee, AbsenceEntry } from '$lib/domain/types';
import { AbsenceType, Duration } from '$lib/domain/types';

export async function generateReport(
    year: number,
    month: number, // 1-12
    employees: Employee[],
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

    // Loop Employees
    for (const emp of employees) {
        if (y < 100) { // New Page
            // page = doc.addPage(); y = height - 50;
        }

        page.drawText(emp.name, {
            x: 50,
            y,
            size: 14,
            font: fontBold
        });
        y -= 20;

        // Entries for this employee in this month
        const empEntries = entries.filter(e => e.employeeId === emp.id).sort((a, b) => a.date.localeCompare(b.date));

        if (empEntries.length === 0) {
            page.drawText('Keine Abwesenheiten', { x: 70, y, size: 10, font });
            y -= 20;
        } else {
            // Stats
            const stats = {
                [AbsenceType.FREE]: 0,
                [AbsenceType.VACATION]: 0,
                [AbsenceType.SICK]: 0
            };

            for (const e of empEntries) {
                const val = e.duration === Duration.FULL ? 1 : 0.5;
                stats[e.category] += val;

                const dLabel = e.duration === Duration.FULL ? 'Ganztag' : (e.duration === Duration.HALF_AM ? 'Vormittag' : 'Nachmittag');
                const cLabel = e.category === AbsenceType.FREE ? 'Frei' : (e.category === AbsenceType.VACATION ? 'Urlaub' : 'Krank');
                const dateLabel = format(new Date(e.date), 'dd.MM.');

                page.drawText(`${dateLabel} ${cLabel} (${dLabel})`, { x: 70, y, size: 10, font });
                y -= 15;
            }

            // Summary line
            y -= 5;
            const summary = `Summe: Frei: ${stats.FREE}, Urlaub: ${stats.VACATION}, Krank: ${stats.SICK}`;
            page.drawText(summary, { x: 70, y, size: 10, font: fontBold });
            y -= 25;
        }

        y -= 10;
    }

    // Signature
    y -= 30;
    page.drawLine({
        start: { x: 50, y },
        end: { x: 550, y },
        thickness: 1,
        color: rgb(0, 0, 0)
    });
    y -= 20;
    page.drawText('Kontrolle/Unterschrift: _________________________   Datum: __________', {
        x: 50,
        y,
        size: 12,
        font
    });

    return await doc.save();
}
