import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Employee, AbsenceEntry } from '$lib/domain/types';
import { AbsenceType, Duration } from '$lib/domain/types';
import JSZip from 'jszip';
import Holidays from 'date-holidays';

export async function generateEmployeePdf(
    startDate: string,
    endDate: string,
    emp: Employee,
    entries: AbsenceEntry[],
    allEntries?: AbsenceEntry[]
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    let currentPage = doc.addPage();
    const { width, height } = currentPage.getSize();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Title
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const titleStr = `${format(startObj, 'dd.MM.yyyy')} - ${format(endObj, 'dd.MM.yyyy')}`;
    currentPage.drawText(`Abwesenheitsreport:`, {
        x: 50,
        y: height - 50,
        size: 20,
        font: fontBold,
        color: rgb(0, 0, 0)
    });
    currentPage.drawText(titleStr, {
        x: 50,
        y: height - 75,
        size: 16,
        font: font,
        color: rgb(0, 0, 0)
    });

    let y = height - 120;

    // Clean strings to prevent pdf-lib crash with standard fonts
    const safeName = (emp.name || '').replace(/[–—]/g, '-').replace(/[„“”]/g, '"');
    const safeJobTitle = (emp.jobTitle || '').replace(/[–—]/g, '-').replace(/[„“”]/g, '"');
    const safeWorkingHours = (emp.workingHours || '').replace(/[–—]/g, '-').replace(/[„“”]/g, '"');

    // Employee Name Header
    currentPage.drawText(`Mitarbeiter: ${safeName}`, {
        x: 50,
        y,
        size: 16,
        font: fontBold
    });
    y -= 20;

    if (emp.jobTitle) {
        currentPage.drawText(`Job Bezeichnung: ${safeJobTitle}`, {
            x: 50,
            y,
            size: 12,
            font: font
        });
        y -= 20;
    }

    if (emp.workingHours) {
        currentPage.drawText(`Allgemeine Arbeitszeit: ${safeWorkingHours}`, {
            x: 50,
            y,
            size: 12,
            font: font
        });
        y -= 20;
    }
    
    y -= 10;

    // Stats Init
    const stats: Record<AbsenceType, number> = {
        [AbsenceType.NONE]: 0,
        [AbsenceType.FREE]: 0,
        [AbsenceType.VACATION]: 0,
        [AbsenceType.SICK]: 0
    };

    // Entries for this employee in this time range
    const empEntries = entries.filter(e => e.employeeId === emp.id && e.date >= startDate && e.date <= endDate);
    
    const entryMap = new Map<string, AbsenceEntry>();
    for (const e of empEntries) {
        if (e.category !== AbsenceType.NONE) {
            entryMap.set(e.date, e);
        }
    }

    const sortedEntries = empEntries
        .filter(e => e.category !== AbsenceType.NONE)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (sortedEntries.length === 0) {
        currentPage.drawText('Keine Abwesenheiten', { x: 50, y, size: 12, font });
        y -= 20;
    } else {
        // Table Header
        currentPage.drawText('Datum', { x: 50, y, size: 12, font: fontBold });
        currentPage.drawText('Art', { x: 150, y, size: 12, font: fontBold });
        currentPage.drawText('Dauer', { x: 300, y, size: 12, font: fontBold });
        y -= 20;
        currentPage.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 550, y: y + 5 }, thickness: 1 });
        y -= 5;

        for (const entry of sortedEntries) {
            const val = entry.duration === Duration.FULL ? 1 : 0.5;
            stats[entry.category] += val;

            const dLabel = entry.duration === Duration.FULL ? 'Ganztag' : (entry.duration === Duration.HALF_AM ? 'Vormittag' : 'Nachmittag');
            const cLabel = entry.category === AbsenceType.FREE ? 'Frei' : (entry.category === AbsenceType.VACATION ? 'Urlaub' : 'Krank');
            const dateLabel = format(new Date(entry.date), 'dd.MM.yyyy');

            currentPage.drawText(dateLabel, { x: 50, y, size: 11, font });
            currentPage.drawText(cLabel, { x: 150, y, size: 11, font });
            currentPage.drawText(dLabel, { x: 300, y, size: 11, font });

            y -= 20;

            if (y < 50) {
                currentPage = doc.addPage();
                y = height - 50;
            }
        }

        y -= 10;
        currentPage.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 550, y: y + 5 }, thickness: 1 });
        y -= 20;

        // Summary 
        const summary = `Summe: Frei: ${stats.FREE} Tag(e), Urlaub: ${stats.VACATION} Tag(e), Krank: ${stats.SICK} Tag(e)`;
        
        if (y < 50) {
            currentPage = doc.addPage();
            y = height - 50;
        }

        currentPage.drawText(summary, { x: 50, y, size: 12, font: fontBold });
        y -= 40;
    }

    // Fetch holidays
    const hd = new Holidays('AT');
    const startYear = startObj.getFullYear();
    const endYear = endObj.getFullYear();
    let publicHolidays: any[] = [];
    for (let yr = startYear; yr <= endYear; yr++) {
        publicHolidays = publicHolidays.concat(hd.getHolidays(yr).filter((h: any) => h.type === 'public'));
    }

    // Filter holidays for the date range
    let validHolidays = [];
    for (const h of publicHolidays) {
        let hDateStr = '';
        if(typeof h.start === 'string') { 
                hDateStr = new Date(h.start).toISOString().split('T')[0];
        } else {
                hDateStr = format(h.start, 'yyyy-MM-dd');
        }
        
        if (hDateStr >= startDate && hDateStr <= endDate) {
            validHolidays.push({ ...h, dateStr: hDateStr });
        }
    }

    // Render Holidays
    if (validHolidays.length > 0) {
        if (y < 120) {
            currentPage = doc.addPage();
            y = height - 50;
        }

        currentPage.drawText('Feiertage in diesem Zeitraum', { x: 50, y, size: 14, font: fontBold });
        y -= 25;

        for (const holiday of validHolidays) {
            const hDateFormatted = format(new Date(holiday.dateStr), 'dd.MM.yyyy');
            let safeName = holiday.name;
            if(safeName.length > 35) safeName = safeName.substring(0, 32) + '...';

            currentPage.drawText(hDateFormatted, { x: 50, y, size: 11, font });
            currentPage.drawText(safeName, { x: 150, y, size: 11, font });

            // Check if employee had FREE or VACATION entry
            const hadOff = entryMap.has(holiday.dateStr) && 
                (entryMap.get(holiday.dateStr)!.category === AbsenceType.FREE || entryMap.get(holiday.dateStr)!.category === AbsenceType.VACATION);

            if (hadOff) {
                const cx = 350;
                const cy = y + 4; 
                
                // Draw green checkmark (two intersecting lines)
                currentPage.drawLine({
                    start: { x: cx, y: cy },
                    end: { x: cx + 4, y: cy - 4 },
                    thickness: 2,
                    color: rgb(0.1, 0.7, 0.1)
                });
                currentPage.drawLine({
                    start: { x: cx + 4, y: cy - 4 },
                    end: { x: cx + 11, y: cy + 5 },
                    thickness: 2,
                    color: rgb(0.1, 0.7, 0.1)
                });

                currentPage.drawText('Frei gehabt', { x: cx + 20, y, size: 11, font, color: rgb(0.1, 0.7, 0.1) });
            }

            y -= 20;
            if (y < 50) {
                currentPage = doc.addPage();
                y = height - 50;
            }
        }
        y -= 20;
    }

    // Vacation calculation
    if (emp.firstWorkDay) {
        if (y < 120) {
            currentPage = doc.addPage();
            y = height - 50;
        }

        const startCalcDt = new Date(emp.firstWorkDay);
        let endCalcStr = endDate;
        if (emp.lastWorkDay && emp.lastWorkDay <= endDate) {
            endCalcStr = emp.lastWorkDay;
        }
        const endCalcDt = new Date(endCalcStr);

        let sundayCount = 0;
        let curr = new Date(startCalcDt);
        while (curr <= endCalcDt) {
            if (curr.getDay() === 0) sundayCount++;
            curr.setDate(curr.getDate() + 1);
        }

        const relevantAllEntries = (allEntries || entries).filter(e => 
            e.employeeId === emp.id && 
            e.date >= emp.firstWorkDay! && 
            e.date <= endCalcStr
        );

        let vacationTaken = 0;
        for (const e of relevantAllEntries) {
            if (e.category === AbsenceType.VACATION || e.category === AbsenceType.FREE) {
                vacationTaken += (e.duration === Duration.FULL ? 1 : 0.5);
            }
        }

        let holidaysWorked = 0;
        const hdCalc = new Holidays('AT');
        let pbHols: any[] = [];
        for (let yr = startCalcDt.getFullYear(); yr <= endCalcDt.getFullYear(); yr++) {
            pbHols = pbHols.concat(hdCalc.getHolidays(yr).filter((h: any) => h.type === 'public'));
        }

        for (const h of pbHols) {
            let hDateStr = '';
            if(typeof h.start === 'string') { 
                hDateStr = new Date(h.start).toISOString().split('T')[0];
            } else {
                hDateStr = format(h.start, 'yyyy-MM-dd');
            }
            if (hDateStr >= emp.firstWorkDay && hDateStr <= endCalcStr) {
                const hadOff = relevantAllEntries.find(e => e.date === hDateStr && (e.category === AbsenceType.FREE || e.category === AbsenceType.VACATION));
                if (!hadOff) holidaysWorked++;
            }
        }

        const result = sundayCount + holidaysWorked - vacationTaken;
        const resultText = result > 0 ? `${result} Tag(e) Resturlaub` : (result === 0 ? 'Kein Resturlaub' : `${Math.abs(result)} Tag(e) zu viel verbraucht`);
        
        currentPage.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 550, y: y + 5 }, thickness: 1 });
        y -= 20;
        currentPage.drawText('Urlaubsabrechnung (Erster bis letzter Arbeitstag)', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        currentPage.drawText(`Berechnung: ${sundayCount} Sonntage + ${holidaysWorked} gearbeitete Feiertage - ${vacationTaken} Freie Tage / Urlaubstage`, { x: 50, y, size: 10, font: font });
        y -= 15;
        currentPage.drawText(`Ergebnis: ${resultText}`, { x: 50, y, size: 12, font: fontBold, color: rgb(0.1, 0.5, 0.8) });
        y -= 30;
    }

    // Signature
    if (y < 100) {
        currentPage = doc.addPage();
        y = height - 100;
    } else {
        y = 80; // Bottom of page
    }

    currentPage.drawLine({
        start: { x: 50, y },
        end: { x: 250, y },
        thickness: 1,
        color: rgb(0, 0, 0)
    });
    currentPage.drawText('Datum, Unterschrift Mitarbeiter', { x: 50, y: y - 15, size: 10, font });

    currentPage.drawLine({
        start: { x: 300, y },
        end: { x: 500, y },
        thickness: 1,
        color: rgb(0, 0, 0)
    });
    currentPage.drawText('Datum, Unterschrift Vorgesetzter', { x: 300, y: y - 15, size: 10, font });

    return await doc.save();
}

export async function generateAllReportsZip(
    startDate: string,
    endDate: string,
    employees: Employee[],
    entries: AbsenceEntry[],
    allEntries?: AbsenceEntry[]
): Promise<Blob> {
    const zip = new JSZip();
    const folderName = `Abwesenheiten_${startDate}_bis_${endDate}`;
    const folder = zip.folder(folderName);

    if (!folder) throw new Error("Could not create ZIP folder");

    for (const emp of employees) {
        if (!emp.active) continue; 

        const pdfBytes = await generateEmployeePdf(startDate, endDate, emp, entries, allEntries);
        // Filename: Name_YYYY-MM-DD_bis_YYYY-MM-DD.pdf
        const filename = `${emp.name.replace(/[^a-z0-9]/gi, '_')}_${startDate}_bis_${endDate}.pdf`;
        folder.file(filename, pdfBytes);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    return content;
}
