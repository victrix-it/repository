const XLSX = require('xlsx');

// Read Priority Matrix
console.log("=== PRIORITY MATRIX ===");
const priorityWorkbook = XLSX.readFile('attached_assets/Priority Matrix_1760966054924.xlsx');
priorityWorkbook.SheetNames.forEach(sheetName => {
  console.log(`\nSheet: ${sheetName}`);
  const sheet = priorityWorkbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  data.forEach((row, i) => {
    console.log(`Row ${i}: ${JSON.stringify(row)}`);
  });
});

// Read SLAs
console.log("\n\n=== SLA DOCUMENT ===");
const slaWorkbook = XLSX.readFile('attached_assets/SLAs_1760966054924.xlsx');
slaWorkbook.SheetNames.forEach(sheetName => {
  console.log(`\nSheet: ${sheetName}`);
  const sheet = slaWorkbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  data.forEach((row, i) => {
    console.log(`Row ${i}: ${JSON.stringify(row)}`);
  });
});
