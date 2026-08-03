function AdminLogin({ onLogin }) {
  try {
    const [credentials, setCredentials] = React.useState({
      username: '',
      password: ''
    });
    const [error, setError] = React.useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      setError('');

      // Admin credentials
      if (credentials.username === 'admin' && credentials.password === 'admin2024') {
        onLogin({
          username: credentials.username,
          name: 'System Administrator',
          loginTime: new Date().toISOString()
        });
      } else {
        setError('Invalid admin credentials');
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4" data-name="admin-login" data-file="components/AdminLogin.js">
        <div className="card max-w-md w-full">
          <div className="text-center mb-6">
            <div className="icon-shield-check text-4xl text-[var(--primary-color)] mb-4"></div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Panel</h1>
            <p className="text-[var(--text-secondary)] mt-2">System Administrator Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="input-field"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="input-field"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div className="text-[var(--danger-color)] text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full">
              Sign In as Admin
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = 'index.html'}
              className="text-sm text-[var(--primary-color)] hover:underline"
            >
              Back to Main System
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AdminLogin component error:', error);
    return null;
  }
}