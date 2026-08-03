function ExcelImportModal({ classId, onImport, onCancel }) {
  try {
    const [fileData, setFileData] = React.useState([]);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const [preview, setPreview] = React.useState([]);

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      setError('');
      setPreview([]);
      
      if (!file) return;

      const isCSV = file.name.endsWith('.csv');
      const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (!isCSV && !isXLSX) {
        setError('Please upload a valid CSV or Excel (.xlsx) file.');
        return;
      }

      const reader = new FileReader();
      
      if (isCSV) {
        reader.onload = (event) => {
          try {
            const text = event.target.result;
            const rows = text.split('\n').filter(row => row.trim());
            processData(rows.map(row => row.split(',').map(col => col.trim().replace(/^"|"$/g, ''))));
          } catch (err) {
            console.error('File parsing error:', err);
            setError('Error parsing the file. Please ensure it is a valid CSV format.');
          }
        };
        reader.readAsText(file);
      } else {
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            processData(jsonData);
          } catch (err) {
            console.error('Excel parsing error:', err);
            setError('Error parsing the Excel file. Please ensure it is a valid .xlsx or .xls file.');
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };

    const processData = (rows) => {
      if (!rows || rows.length <= 1) {
        setError('The file seems to be empty or missing data.');
        return;
      }

      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const idIdx = headers.findIndex(h => h.includes('id') || h.includes('student'));

      if (nameIdx === -1 || idIdx === -1) {
        setError('Could not find "Name" and "Student ID" columns. Please ensure your file has these headers.');
        return;
      }

      const parsedStudents = rows.slice(1).map((columns, index) => {
        const studentId = String(columns[idIdx] || '').trim();
        return {
          id: Date.now().toString() + index,
          name: String(columns[nameIdx] || '').trim(),
          studentId: studentId,
          email: studentId ? `${studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@student.edu` : '',
          joinDate: new Date().toISOString()
        };
      }).filter(s => s.name && s.studentId);

      if (parsedStudents.length === 0) {
        setError('No valid student records found in the file.');
      } else {
        setFileData(parsedStudents);
        setPreview(parsedStudents.slice(0, 5));
      }
    };

    const handleImport = () => {
      if (fileData.length === 0) return;

      const existingStudents = getStudents(classId);
      const existingIds = new Set(existingStudents.map(s => s.studentId));
      
      let importedCount = 0;
      let skippedCount = 0;

      fileData.forEach(student => {
        if (!existingIds.has(student.studentId)) {
          saveStudent(classId, student);
          importedCount++;
        } else {
          skippedCount++;
        }
      });

      setSuccess(`Successfully imported ${importedCount} students.${skippedCount > 0 ? ` (${skippedCount} already existed and were skipped)` : ''}`);
      setTimeout(() => {
        onImport();
      }, 1500);
    };

    const downloadTemplate = () => {
      const csvContent = "Student Name,Student ID\nJohn Doe,STU001\nJane Smith,STU002";
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'student_template.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="excel-import-modal" data-file="components/ExcelImportModal.js">
        <div className="card max-w-lg w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Import from Excel/CSV</h2>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <div className="icon-info text-lg"></div>
                Please upload a CSV or Excel file with "Student Name" and "Student ID" columns.
              </p>
              <button 
                onClick={downloadTemplate}
                className="text-xs text-blue-600 font-medium hover:underline mt-2 flex items-center gap-1"
              >
                <div className="icon-download text-xs"></div>
                Download Template CSV
              </button>
            </div>

            <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center hover:border-[var(--primary-color)] transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="icon-file-spreadsheet text-4xl text-[var(--text-secondary)] mb-2"></div>
              <p className="text-[var(--text-primary)] font-medium">Click or drag CSV or Excel file here</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Supported formats: .csv, .xlsx, .xls</p>
            </div>

            {error && (
              <div className="text-[var(--danger-color)] text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-[var(--accent-color)] text-sm bg-green-50 p-3 rounded-lg">
                {success}
              </div>
            )}

            {preview.length > 0 && !success && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Preview (First 5 records):</h3>
                <div className="bg-[var(--secondary-color)] rounded-lg overflow-hidden border border-[var(--border-color)]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-200">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((s, i) => (
                        <tr key={i} className="border-t border-[var(--border-color)]">
                          <td className="p-2">{s.name}</td>
                          <td className="p-2 font-mono">{s.studentId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">Total records found: {fileData.length}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button onClick={onCancel} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={fileData.length === 0 || success}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                Import {fileData.length} Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ExcelImportModal component error:', error);
    return null;
  }
}