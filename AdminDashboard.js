function AdminDashboard({ admin, onLogout }) {
  try {
    const [activeView, setActiveView] = React.useState('overview');
    const [stats, setStats] = React.useState({
      teachers: 0,
      students: 0,
      classes: 0
    });

    React.useEffect(() => {
      updateStats();
    }, []);

    const updateStats = () => {
      const teachers = getTeachers();
      const classes = getClasses();
      let totalStudents = 0;
      
      classes.forEach(classItem => {
        totalStudents += getStudents(classItem.id).length;
      });

      setStats({
        teachers: teachers.length,
        students: totalStudents,
        classes: classes.length
      });
    };

    const sidebarItems = [
      { id: 'overview', label: 'Overview', icon: 'home' },
      { id: 'teachers', label: 'Manage Teachers', icon: 'users' },
      { id: 'students', label: 'Manage Students', icon: 'graduation-cap' },
      { id: 'sessions', label: 'Manage Sessions', icon: 'clock' },
      { id: 'classes', label: 'View Classes', icon: 'book-open' }
    ];

    return (
      <div className="flex h-screen bg-gray-50" data-name="admin-dashboard" data-file="components/AdminDashboard.js">
        {/* Sidebar */}
        <div className="w-[var(--sidebar-width)] bg-white border-r border-[var(--border-color)] flex flex-col">
          <div className="p-6 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Admin Panel</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{admin.name}</p>
          </div>

          <div className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
              >
                <div className={`icon-${item.icon} text-lg`}></div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[var(--border-color)]">
            <button onClick={onLogout} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <div className="icon-log-out text-lg"></div>
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-[var(--border-color)] p-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {activeView === 'overview' && 'System Overview'}
              {activeView === 'teachers' && 'Teacher Management'}
              {activeView === 'students' && 'Student Management'}
              {activeView === 'sessions' && 'Session Management'}
              {activeView === 'classes' && 'Class Overview'}
            </h1>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {activeView === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card">
                    <div className="flex items-center">
                      <div className="icon-users text-3xl text-blue-500 mr-4"></div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.teachers}</div>
                        <div className="text-[var(--text-secondary)]">Teachers</div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center">
                      <div className="icon-graduation-cap text-3xl text-green-500 mr-4"></div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.students}</div>
                        <div className="text-[var(--text-secondary)]">Students</div>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center">
                      <div className="icon-book-open text-3xl text-purple-500 mr-4"></div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.classes}</div>
                        <div className="text-[var(--text-secondary)]">Classes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'teachers' && (
              <TeacherManager onStatsUpdate={updateStats} />
            )}

            {activeView === 'students' && (
              <StudentManager onStatsUpdate={updateStats} />
            )}

            {activeView === 'sessions' && (
              <SessionManager onStatsUpdate={updateStats} />
            )}

            {activeView === 'classes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getClasses().map((classItem) => (
                  <div key={classItem.id} className="card">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{classItem.name}</h3>
                    <p className="text-[var(--text-secondary)]">{classItem.subject}</p>
                    <p className="text-sm text-[var(--text-secondary)]">Year: {classItem.grade}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">
                      Students: {getStudents(classItem.id).length}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AdminDashboard component error:', error);
    return null;
  }
}