function StudentManager({ onStatsUpdate }) {
  try {
    const [classes, setClasses] = React.useState([]);
    const [selectedClass, setSelectedClass] = React.useState('all');
    const [students, setStudents] = React.useState([]);

    React.useEffect(() => {
      loadClasses();
      loadStudents();
    }, []);

    React.useEffect(() => {
      loadStudents();
    }, [selectedClass]);

    const loadClasses = () => {
      const allClasses = getClasses();
      setClasses(allClasses);
    };

    const loadStudents = () => {
      let allStudents = [];
      
      if (selectedClass === 'all') {
        classes.forEach(classItem => {
          const classStudents = getStudents(classItem.id);
          classStudents.forEach(student => {
            allStudents.push({
              ...student,
              className: classItem.name,
              classSubject: classItem.subject
            });
          });
        });
      } else {
        const classStudents = getStudents(selectedClass);
        const classItem = classes.find(c => c.id === selectedClass);
        classStudents.forEach(student => {
          allStudents.push({
            ...student,
            className: classItem?.name || 'Unknown Class',
            classSubject: classItem?.subject || 'Unknown Subject'
          });
        });
      }
      
      // Sort students alphabetically by name
      allStudents.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(allStudents);
      onStatsUpdate();
    };

    const handleDeleteStudent = (classId, studentId) => {
      if (confirm('Are you sure you want to remove this student?')) {
        deleteStudent(classId, studentId);
        loadStudents();
      }
    };

    const getClassIdFromStudent = (student) => {
      const classItem = classes.find(c => c.name === student.className);
      return classItem ? classItem.id : null;
    };

    return (
      <div className="space-y-6" data-name="student-manager" data-file="components/StudentManager.js">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Student Management</h2>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Classes</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} - {classItem.subject}
              </option>
            ))}
          </select>
        </div>

        {students.length === 0 ? (
          <div className="card text-center">
            <div className="icon-graduation-cap text-4xl text-[var(--text-secondary)] mb-4"></div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Students Found</h3>
            <p className="text-[var(--text-secondary)]">Students will appear here once they join classes</p>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Student ID</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Class</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Join Date</th>
                    <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={`${student.id}_${student.className}`} className="border-b border-[var(--border-color)]">
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{student.name}</td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{student.studentId}</td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        <div>{student.className}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{student.classSubject}</div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {new Date(student.joinDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteStudent(getClassIdFromStudent(student), student.id)}
                          className="text-[var(--danger-color)] hover:bg-red-50 p-1 rounded"
                          title="Remove Student"
                        >
                          <div className="icon-trash-2 text-lg"></div>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('StudentManager component error:', error);
    return null;
  }
}
