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

function AdminApp() {
  try {
    const [admin, setAdmin] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const savedAdmin = localStorage.getItem('attendanceAdmin');
      if (savedAdmin) {
        setAdmin(JSON.parse(savedAdmin));
      }
      setLoading(false);
    }, []);

    const handleLogin = (adminData) => {
      setAdmin(adminData);
      localStorage.setItem('attendanceAdmin', JSON.stringify(adminData));
    };

    const handleLogout = () => {
      setAdmin(null);
      localStorage.removeItem('attendanceAdmin');
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center" data-name="loading" data-file="admin-app.js">
          <div className="text-center">
            <div className="icon-loader-2 text-4xl text-[var(--primary-color)] animate-spin mb-4"></div>
            <p className="text-[var(--text-secondary)]">Loading...</p>
          </div>
        </div>
      );
    }

    if (!admin) {
      return <AdminLogin onLogin={handleLogin} />;
    }

    return (
      <div className="min-h-screen bg-gray-50" data-name="admin-app" data-file="admin-app.js">
        <AdminDashboard admin={admin} onLogout={handleLogout} />
      </div>
    );
  } catch (error) {
    console.error('AdminApp component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <AdminApp />
  </ErrorBoundary>
);