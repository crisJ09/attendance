function AccountForm({ type, accountData, onSave, onCancel }) {
  try {
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    React.useEffect(() => {
      if (accountData) {
        setFormData({
          name: accountData.name || '',
          email: accountData.email || '',
          password: '',
          confirmPassword: ''
        });
      }
    }, [accountData]);

    const handleSubmit = (e) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      if (!formData.name.trim() || !formData.email.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      if (!accountData && (!formData.password || !formData.confirmPassword)) {
        setError('Please enter and confirm password for new account');
        return;
      }

      if (!accountData && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (!accountData && formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Check for duplicate email
      const existingTeachers = getTeachers();
      const duplicateEmail = existingTeachers.find(t => 
        t.email === formData.email.trim() && 
        (!accountData || t.id !== accountData.id)
      );
      
      if (duplicateEmail) {
        setError('An account with this email already exists');
        return;
      }

      const account = {
        id: accountData?.id || Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password || accountData?.password,
        createdAt: accountData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (type === 'teacher') {
        saveTeacher(account);
      }

      setSuccess(`${type} account ${accountData ? 'updated' : 'created'} successfully!`);
      setTimeout(() => {
        onSave();
      }, 1000);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="account-form" data-file="components/AccountForm.js">
        <div className="card max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {accountData ? 'Edit' : 'Add'} {type === 'teacher' ? 'Teacher' : 'Student'} Account
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
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="teacher@school.edu"
                required
              />
            </div>

            {!accountData && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </>
            )}

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
                {accountData ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AccountForm component error:', error);
    return null;
  }
}