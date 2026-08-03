function StudentImportModal({ availableClasses, onImport, onCancel, teacherEmail }) {
  try {
    const [selectedClass, setSelectedClass] = React.useState('');
    const [classStudents, setClassStudents] = React.useState([]);
    const [selectedStudents, setSelectedStudents] = React.useState(new Set());

    React.useEffect(() => {
      if (selectedClass) {
        const students = getStudents(selectedClass);
        setClassStudents(students);
        setSelectedStudents(new Set());
      }
    }, [selectedClass]);

    const handleStudentToggle = (studentId) => {
      const newSelected = new Set(selectedStudents);
      if (newSelected.has(studentId)) {
        newSelected.delete(studentId);
      } else {
        newSelected.add(studentId);
      }
      setSelectedStudents(newSelected);
    };

    const handleSelectAll = () => {
      if (selectedStudents.size === classStudents.length) {
        setSelectedStudents(new Set());
      } else {
        setSelectedStudents(new Set(classStudents.map(s => s.id)));
      }
    };

    const handleImport = () => {
      if (selectedClass && selectedStudents.size > 0) {
        onImport(selectedClass, Array.from(selectedStudents));
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="student-import-modal" data-file="components/StudentImportModal.js">
        <div className="card max-w-2xl w-full max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Import Students</h2>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-auto">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Select Source Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a class...</option>
                {availableClasses.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.subject}
                  </option>
                ))}
              </select>
            </div>

            {selectedClass && classStudents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">
                    Students ({classStudents.length})
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-[var(--primary-color)] hover:underline"
                  >
                    {selectedStudents.size === classStudents.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="border border-[var(--border-color)] rounded-lg max-h-60 overflow-y-auto">
                  {classStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center p-3 border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--secondary-color)] cursor-pointer"
                      onClick={() => handleStudentToggle(student.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)]">{student.name}</div>
                        <div className="text-sm text-[var(--text-secondary)]">{student.studentId}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClass && classStudents.length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <div className="icon-users text-3xl mb-2"></div>
                <p>No students found in the selected class</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--border-color)] mt-4">
            <button onClick={onCancel} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedStudents.size === 0}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {selectedStudents.size} Students
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('StudentImportModal component error:', error);
    return null;
  }
}