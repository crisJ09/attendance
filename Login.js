function Login({ onLogin }) {
  try {
    const [userType, setUserType] = React.useState('teacher');
    const [isRegisterMode, setIsRegisterMode] = React.useState(false);
    const [formData, setFormData] = React.useState({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      name: '',
      studentId: ''
    });
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      if (userType === 'teacher') {
        if (isRegisterMode) {
          // Teacher registration
          if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all required fields');
            return;
          }

          if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
          }

          if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
          }

          // Check if teacher already exists
          const existingTeachers = getTeachers();
          const teacherExists = existingTeachers.some(t => t.email === formData.email);
          
          if (teacherExists) {
            setError('A teacher account with this email already exists');
            return;
          }

          // Create new teacher account
          const newTeacher = {
            id: Date.now().toString(),
            email: formData.email.trim(),
            password: formData.password,
            name: formData.fullName.trim(),
            createdAt: new Date().toISOString()
          };

          saveTeacher(newTeacher);
          setSuccess('Teacher account created successfully! You can now log in.');
          setIsRegisterMode(false);
          setFormData({ email: '', password: '', confirmPassword: '', fullName: '', name: '', studentId: '' });
          return;
        } else {
          // Teacher login
          if (formData.email === 'teacher@school.edu' && formData.password === 'admin123') {
            // Migrate legacy data for demo teacher account
            migrateLegacyClasses();
            onLogin({
              type: 'teacher',
              email: formData.email,
              name: 'Teacher Admin'
            });
            return;
          }

          // Check registered teachers
          const existingTeachers = getTeachers();
          const teacher = existingTeachers.find(t => t.email === formData.email && t.password === formData.password);
          
          if (teacher) {
            onLogin({
              type: 'teacher',
              email: teacher.email,
              name: teacher.name
            });
          } else {
            setError('Invalid teacher credentials');
          }
        }
      } else {
        // Validate student input
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
        
        // Student ID validation
        if (studentId.length < 3) {
          setError('Student ID must be at least 3 characters long');
          return;
        }
        
        if (studentId.length > 20) {
          setError('Student ID cannot exceed 20 characters');
          return;
        }
        
        const normalizedStudentId = String(studentId).trim().toUpperCase();
        onLogin({
          type: 'student',
          name: name,
          studentId: normalizedStudentId,
          loginTime: new Date().toISOString()
        });
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4" data-name="login" data-file="components/Login.js">
        <div className="card max-w-md w-full">
          <div className="text-center mb-6">
            <div className="icon-graduation-cap text-4xl text-[var(--primary-color)] mb-4"></div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Attendance System</h1>
            <p className="text-[var(--text-secondary)] mt-2">Sign in to manage or view attendance</p>
          </div>

          <div className="flex mb-6 bg-[var(--secondary-color)] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setUserType('teacher')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                userType === 'teacher' ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                userType === 'student' ? 'bg-white text-[var(--primary-color)] shadow-sm' : 'text-[var(--text-secondary)]'
              }`}
            >
              Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {userType === 'teacher' ? (
              <>
                {isRegisterMode && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="input-field"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder={isRegisterMode ? "Enter your email" : "teacher@school.edu"}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder="Enter password"
                    required
                  />
                </div>
                {isRegisterMode && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input-field"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="John Smith"
                    maxLength="50"
                    autoComplete="name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Enter your first and last name (letters and spaces only)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value.trim().toUpperCase() })}
                    className="input-field font-mono"
                    placeholder="STU-2024-001"
                    maxLength="20"
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="text"
                    required
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Any characters allowed, 3-20 characters (auto-capitalized)
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="text-[var(--danger-color)] text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-[var(--accent-color)] text-sm text-center bg-green-50 p-3 rounded-lg">
                {success}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full">
              {userType === 'teacher' ? (isRegisterMode ? 'Create Account' : 'Sign In') : 'Sign In'}
            </button>
          </form>

          {userType === 'teacher' && (
            <div className="mt-4 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setSuccess('');
                  setFormData({ email: '', password: '', confirmPassword: '', fullName: '', name: '', studentId: '' });
                }}
                className="text-sm text-[var(--primary-color)] hover:underline"
              >
                {isRegisterMode ? 'Already have an account? Sign in' : 'Need an account? Register here'}
              </button>

            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Login component error:', error);
    return null;
  }
}