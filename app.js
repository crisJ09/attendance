class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  try {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [isOnline, setIsOnline] = React.useState(true);

    // Make dbOperation available to all scripts
    if (typeof dbOperation !== 'undefined') {
      window.dbOperation = dbOperation;
    }

    React.useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

    React.useEffect(() => {
      const syncData = () => {
        preserveAllData();
        const savedUser = localStorage.getItem('attendanceUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(parsedUser)) {
              return parsedUser;
            }
            return prev;
          });
        } else {
          setUser(null);
        }
      };

      syncData();
      setLoading(false);

      // Listen for storage changes from other tabs/windows
      const handleStorageChange = (e) => {
        if (!e.key || e.key === 'attendanceUser' || e.key === 'attendanceClasses' || e.key.startsWith('students_') || e.key.startsWith('attendance_')) {
          syncData();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      // Subscribe to internal app-wide storage notifications
      const unsubscribe = subscribeToStorage((key) => {
        if (!key || key === 'attendanceUser' || key === 'attendanceClasses') {
          syncData();
        }
      });
      
      const syncInterval = setInterval(syncData, 2000); // More frequent polling

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        unsubscribe();
        clearInterval(syncInterval);
      };
    }, []);

    const handleLogin = (userData) => {
      setUser(userData);
      localStorage.setItem('attendanceUser', JSON.stringify(userData));
    };

    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('attendanceUser');
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center" data-name="loading" data-file="app.js">
          <div className="text-center">
            <div className="icon-loader-2 text-4xl text-[var(--primary-color)] animate-spin mb-4"></div>
            <p className="text-[var(--text-secondary)]">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return <Login onLogin={handleLogin} />;
    }

    return (
      <div className="min-h-screen bg-gray-50" data-name="app" data-file="app.js">
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center py-2 text-sm font-bold animate-pulse">
            Network connection lost. Some features may be unavailable.
          </div>
        )}
        {user.type === 'teacher' ? (
          <TeacherDashboard user={user} onLogout={handleLogout} />
        ) : (
          <StudentDashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);