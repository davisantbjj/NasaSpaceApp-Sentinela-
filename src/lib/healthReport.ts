import { indicatorContent } from '../content/indicators';
import { displayText } from '../content/format';
import { exportCrewData } from '../data/privacyRepo';
import i18n from '../i18n';

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

// Printable, self-contained report generated only from the signed-in crew member's export.
export function healthReportHtml(data: Awaited<ReturnType<typeof exportCrewData>>) {
  const { crew } = data;
  const rows = data.records.map((record) => {
    const values = crew.trackedIndicators.map((id) => {
      const value = displayText(record.values, id);
      return value ? `<li><strong>${escape(indicatorContent(id).label)}:</strong> ${escape(value)}</li>` : '';
    }).filter(Boolean).join('');
    return `<tr><td>${escape(new Intl.DateTimeFormat(i18n.language).format(new Date(`${record.date}T12:00:00`)))}</td><td>${record.missionDay}</td><td><ul>${values || `<li>${escape(i18n.t('yourData.pdfNoMeasures'))}</li>`}</ul></td></tr>`;
  }).join('');
  const generated = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(data.exportedAt));
  return `<!doctype html><html lang="${escape(i18n.language)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(i18n.t('yourData.pdfTitle', { name: crew.name }))}</title>
  <style>
  :root{font:14px/1.55 Arial, sans-serif;color:#172638}body{margin:0;background:#e9edf3}.sheet{max-width:920px;margin:32px auto;padding:48px 56px;background:white;box-shadow:0 10px 40px #1524381a}header{padding-bottom:22px;border-bottom:3px solid #256999}header small{color:#527087;text-transform:uppercase;letter-spacing:.1em}h1{margin:8px 0;font-size:28px}h2{margin:26px 0 10px;font-size:17px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;margin:18px 0}.notice{padding:12px 15px;background:#eef5f8;border-left:3px solid #4781a4}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:10px;vertical-align:top;border-bottom:1px solid #dce3e9;text-align:left}.table th{background:#f2f5f8}.table td:nth-child(1),.table td:nth-child(2){white-space:nowrap;font-variant-numeric:tabular-nums}.table ul{margin:0;padding-left:18px;columns:2}.table li{break-inside:avoid;padding-right:10px}.foot{margin-top:26px;padding-top:12px;border-top:1px solid #dce3e9;color:#526376;font-size:12px}.actions{position:sticky;top:0;display:flex;justify-content:flex-end;padding:12px 5vw;background:#172638}.actions button{padding:10px 18px;border:0;border-radius:6px;background:#8fc1e7;color:#10283b;font-weight:bold;cursor:pointer}@page{size:A4;margin:14mm}@media print{body{background:white}.sheet{max-width:none;margin:0;padding:0;box-shadow:none}.actions{display:none}tr{break-inside:avoid}header{break-after:avoid}.table ul{columns:2}}@media(max-width:640px){.sheet{margin:0;padding:24px 16px}.meta{grid-template-columns:1fr}.table ul{columns:1}}
  </style><body><div class="actions"><button onclick="window.print()">${escape(i18n.t('yourData.pdfPrint'))}</button></div><main class="sheet"><header><small>Sentinela · ${escape(i18n.t('yourData.pdfEyebrow'))}</small><h1>${escape(i18n.t('yourData.pdfTitle', { name: crew.name }))}</h1><p>${escape(i18n.t('yourData.pdfSubtitle'))}</p></header><div class="meta"><div><strong>${escape(i18n.t('yourData.pdfName'))}:</strong> ${escape(crew.name)}</div><div><strong>${escape(i18n.t('yourData.pdfRole'))}:</strong> ${escape(crew.role)}</div><div><strong>${escape(i18n.t('yourData.pdfMissionStart'))}:</strong> ${escape(crew.missionStart)}</div><div><strong>${escape(i18n.t('yourData.pdfExported'))}:</strong> ${escape(generated)}</div></div><p class="notice">${escape(i18n.t('yourData.pdfNotice'))}</p><h2>${escape(i18n.t('yourData.pdfHistory'))}</h2><table class="table"><thead><tr><th>${escape(i18n.t('yourData.pdfDate'))}</th><th>${escape(i18n.t('yourData.pdfDay'))}</th><th>${escape(i18n.t('yourData.pdfIndicators'))}</th></tr></thead><tbody>${rows}</tbody></table><p class="foot">${escape(i18n.t('yourData.pdfDisclaimer'))}</p></main></body></html>`;
}

export async function openHealthReport(crewId: string) {
  // Open synchronously in the click gesture so browser popup blockers do not lose the export.
  const report = window.open('', '_blank');
  if (!report) throw new Error('popup-blocked');
  try {
    const data = await exportCrewData(crewId);
    report.document.open(); report.document.write(healthReportHtml(data)); report.document.close();
  } catch (error) { report.close(); throw error; }
}
