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

function GradingApp() {
  try {
    const [user, setUser] = React.useState(null);
    const [selectedClass, setSelectedClass] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const savedUser = localStorage.getItem('attendanceUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.type === 'teacher') {
          setUser(userData);
        } else {
          window.location.href = 'index.html';
        }
      } else {
        window.location.href = 'index.html';
      }
      setLoading(false);
    }, []);

    const handleLogout = () => {
      localStorage.removeItem('attendanceUser');
      window.location.href = 'index.html';
    };

    const handleBackToHome = () => {
      window.location.href = 'index.html';
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center" data-name="loading" data-file="grading-app.js">
          <div className="text-center">
            <div className="icon-loader-2 text-4xl text-[var(--primary-color)] animate-spin mb-4"></div>
            <p className="text-[var(--text-secondary)]">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50" data-name="grading-app" data-file="grading-app.js">
        <GradingHeader user={user} onLogout={handleLogout} onBack={handleBackToHome} />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {!selectedClass ? (
            <ClassSelector onClassSelect={setSelectedClass} teacherEmail={user.email} />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <div className="icon-arrow-left text-lg"></div>
                  Back to Classes
                </button>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedClass.name}</h2>
                  <p className="text-[var(--text-secondary)]">{selectedClass.subject} - Year {selectedClass.grade}</p>
                </div>
              </div>
              
              <GradingSystem classData={selectedClass} />
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('GradingApp component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <GradingApp />
  </ErrorBoundary>
);