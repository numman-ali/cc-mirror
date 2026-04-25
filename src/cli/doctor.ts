import type { DoctorReportItem } from '../core/types.js';

export const printDoctor = (report: DoctorReportItem[]) => {
  if (report.length === 0) {
    console.log('No variants found.');
    return;
  }
  for (const item of report) {
    console.log(`${item.ok ? '✓' : '✗'} ${item.name}`);
    if (!item.ok) {
      console.log(`  binary: ${item.binaryPath ?? 'missing'}`);
      console.log(`  wrapper: ${item.wrapperPath}`);
    }
    if (item.bunInfo) {
      const b = item.bunInfo;
      if (b.error) {
        console.log(`  bun: parse failed - ${b.error}`);
      } else {
        const parts = [
          b.platform,
          `${b.moduleCount} modules`,
          b.entryPath ? `entry=${b.entryPath}` : null,
          b.bunVersionHint,
        ].filter(Boolean);
        console.log(`  bun: ${parts.join(', ')}`);
      }
    }
  }
};
