function GradingHeader({ user, onLogout, onBack }) {
  try {
    return (
      <div className="bg-white border-b border-[var(--border-color)]" data-name="grading-header" data-file="components/GradingHeader.js">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="btn btn-secondary flex items-center gap-2"
              >
                <div className="icon-home text-lg"></div>
                Home
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Grade Management</h1>
                <p className="text-[var(--text-secondary)]">Manage quizzes, activities, and exams</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">Teacher</p>
              </div>
              <button onClick={onLogout} className="btn btn-secondary flex items-center gap-2">
                <div className="icon-log-out text-lg"></div>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('GradingHeader component error:', error);
    return null;
  }
}