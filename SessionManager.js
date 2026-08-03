function SessionManager({ onStatsUpdate }) {
  try {
    const [sessions, setSessions] = React.useState([]);
    const [showForm, setShowForm] = React.useState(false);
    const [editingSession, setEditingSession] = React.useState(null);

    React.useEffect(() => {
      loadSessions();
    }, []);

    const loadSessions = () => {
      const allSessions = getSessions();
      setSessions(allSessions);
      if (onStatsUpdate) onStatsUpdate();
    };

    const handleDelete = (sessionId) => {
      if (confirm('Are you sure you want to delete this session? This will affect attendance records.')) {
        deleteSession(sessionId);
        loadSessions();
      }
    };

    const handleEdit = (session) => {
      setEditingSession(session);
      setShowForm(true);
    };

    const handleFormClose = () => {
      setShowForm(false);
      setEditingSession(null);
      loadSessions();
    };

    return (
      <div className="space-y-6" data-name="session-manager" data-file="components/SessionManager.js">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Attendance Sessions</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <div className="icon-plus text-lg"></div>
            Add Session
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{session.name}</h3>
                  <p className="text-[var(--text-secondary)]">{session.description}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Time: {session.startTime} - {session.endTime}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(session)}
                    className="text-[var(--primary-color)] hover:bg-blue-50 p-1 rounded"
                    title="Edit Session"
                  >
                    <div className="icon-edit text-lg"></div>
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-[var(--danger-color)] hover:bg-red-50 p-1 rounded"
                    title="Delete Session"
                  >
                    <div className="icon-trash-2 text-lg"></div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <SessionForm
            sessionData={editingSession}
            onSave={handleFormClose}
            onCancel={handleFormClose}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('SessionManager component error:', error);
    return null;
  }
}