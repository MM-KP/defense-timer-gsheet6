
import * as XLSX from 'xlsx';

export default function downloadExcel(logs, suspect) {
  const data = logs.map(log => {
    const d = new Date(log.date);
    return [
      d.getFullYear(), "年",
      d.getMonth() + 1, "月",
      d.getDate(), "日",
      log.start,
      log.end,
      log.duration,
      log.activity
    ];
  });

  const header = [
    "年数", "年", "月数", "月", "日数", "日",
    "開始時間", "終了時間", "所要時間", "活動項目"
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "弁護活動記録");

  XLSX.writeFile(workbook, `${suspect || 'defense'}_logs.xlsx`);
}
