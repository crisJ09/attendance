function StudentForm({ classId, studentData, onSave, onCancel }) {
  try {
    const [formData, setFormData] = React.useState({
      name: '',
      studentId: '',
      email: ''
    });
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    React.useEffect(() => {
      if (studentData) {
        setFormData({
          name: studentData.name || '',
          studentId: studentData.studentId || '',
          email: studentData.email || ''
        });
      }
    }, [studentData]);

  const handleSubmit = (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      // Validate name
      const name = formData.name.trim();
      const studentId = formData.studentId.trim();
      
      if (!name || !studentId) {
        setError('Please fill in all required fields');
        return;
      }
      
      // Name validation
      if (name.length < 2) {
        setError('Name must be at least 2 characters long');
        return;
      }
      
      if (name.length > 50) {
        setError('Name cannot exceed 50 characters');
        return;
      }
      
      // Check if name contains letters, spaces, and common symbols
      const namePattern = /^[a-zA-Z\s\-'.,]+$/;
      if (!namePattern.test(name)) {
        setError('Name can only contain letters, spaces, and common symbols (-, \', ., ,)');
        return;
      }
      
      // Check for at least first and last name
      const nameParts = name.split(' ').filter(part => part.length > 0);
      if (nameParts.length < 2) {
        setError('Please enter both first and last name');
        return;
      }

      const existingStudents = getStudents(classId);
      const duplicateId = existingStudents.find(s => 
        s.studentId === studentId && 
        (!studentData || s.id !== studentData.id)
      );
      
      if (duplicateId) {
        setError('A student with this ID already exists in the class');
        return;
      }
      
      // Student ID length validation
      if (studentId.length < 3 || studentId.length > 20) {
        setError('Student ID must be between 3 and 20 characters');
        return;
      }

      const student = {
        id: studentData?.id || Date.now().toString(),
        name: name,
        studentId: String(studentId).trim().toUpperCase(),
        email: formData.email.trim() || `${studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || Date.now()}@student.edu`,
        joinDate: studentData?.joinDate || new Date().toISOString()
      };

      saveStudent(classId, student);
      setSuccess(`Student ${studentData ? 'updated' : 'added'} successfully!`);
      setTimeout(() => {
        onSave();
      }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="student-form" data-file="components/StudentForm.js">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {studentData ? 'Edit Student' : 'Add Student'}
          </h2>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Enter student's full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Student ID *
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="input-field"
                placeholder="Enter student ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="student@email.com"
              />
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                If not provided, will use: {formData.studentId}@student.edu
              </p>
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

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                {studentData ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('StudentForm component error:', error);
    return null;
  }
}