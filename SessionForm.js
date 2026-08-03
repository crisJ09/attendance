function SessionForm({ sessionData, onSave, onCancel }) {
  try {
    const [formData, setFormData] = React.useState({
      name: '',
      description: '',
      startTime: '',
      endTime: ''
    });
    const [error, setError] = React.useState('');

    React.useEffect(() => {
      if (sessionData) {
        setFormData({
          name: sessionData.name || '',
          description: sessionData.description || '',
          startTime: sessionData.startTime || '',
          endTime: sessionData.endTime || ''
        });
      }
    }, [sessionData]);

    const handleSubmit = (e) => {
      e.preventDefault();
      setError('');

      if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields');
        return;
      }

      const session = {
        id: sessionData?.id || Date.now().toString(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        createdAt: sessionData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveSession(session);
      onSave();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="session-form" data-file="components/SessionForm.js">
        <div className="card max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {sessionData ? 'Edit Session' : 'Add Session'}
            </h2>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Session Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Session 1, Morning Session"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="Optional session description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-[var(--danger-color)] text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                {sessionData ? 'Update Session' : 'Add Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SessionForm component error:', error);
    return null;
  }
}