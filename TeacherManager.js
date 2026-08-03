function TeacherManager({ onStatsUpdate }) {
  try {
    const [teachers, setTeachers] = React.useState([]);
    const [showForm, setShowForm] = React.useState(false);
    const [editingTeacher, setEditingTeacher] = React.useState(null);

    React.useEffect(() => {
      loadTeachers();
    }, []);

    const loadTeachers = () => {
      const allTeachers = getTeachers();
      setTeachers(allTeachers);
      onStatsUpdate();
    };

    const handleDelete = (teacherId) => {
      if (confirm('Are you sure you want to delete this teacher account?')) {
        deleteTeacher(teacherId);
        loadTeachers();
      }
    };

    const handleEdit = (teacher) => {
      setEditingTeacher(teacher);
      setShowForm(true);
    };

    const handleFormClose = () => {
      setShowForm(false);
      setEditingTeacher(null);
      loadTeachers();
    };

    return (
      <div className="space-y-6" data-name="teacher-manager" data-file="components/TeacherManager.js">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Teacher Accounts</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <div className="icon-plus text-lg"></div>
            Add Teacher
          </button>
        </div>

        {teachers.length === 0 ? (
          <div className="card text-center">
            <div className="icon-users text-4xl text-[var(--text-secondary)] mb-4"></div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Teachers Found</h3>
            <p className="text-[var(--text-secondary)]">Add teacher accounts to get started</p>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Created</th>
                    <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-[var(--border-color)]">
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{teacher.name}</td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{teacher.email}</td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(teacher)}
                            className="text-[var(--primary-color)] hover:bg-purple-50 p-1 rounded"
                            title="Edit Teacher"
                          >
                            <div className="icon-edit text-lg"></div>
                          </button>
                          <button
                            onClick={() => handleDelete(teacher.id)}
                            className="text-[var(--danger-color)] hover:bg-red-50 p-1 rounded"
                            title="Delete Teacher"
                          >
                            <div className="icon-trash-2 text-lg"></div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showForm && (
          <AccountForm
            type="teacher"
            accountData={editingTeacher}
            onSave={handleFormClose}
            onCancel={handleFormClose}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('TeacherManager component error:', error);
    return null;
  }
}