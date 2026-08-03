function ClassSelector({ onClassSelect, teacherEmail }) {
  try {
    const [classes, setClasses] = React.useState([]);

    React.useEffect(() => {
      const loadClasses = async () => {
        try {
          const teacherClasses = await getClassesByTeacher(teacherEmail);
          setClasses(Array.isArray(teacherClasses) ? teacherClasses : []);
        } catch (error) {
          console.error("Error loading classes in selector:", error);
          setClasses([]);
        }
      };
      loadClasses();
    }, [teacherEmail]);

    if (classes.length === 0) {
      return (
        <div className="card text-center" data-name="class-selector-empty" data-file="components/ClassSelector.js">
          <div className="icon-book-open text-4xl text-[var(--text-secondary)] mb-4"></div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Classes Found</h3>
          <p className="text-[var(--text-secondary)] mb-4">Create classes first to manage grades</p>
          <button
            onClick={() => window.location.href = 'index.html'}
            className="btn btn-primary"
          >
            Go to Class Management
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6" data-name="class-selector" data-file="components/ClassSelector.js">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Select a Class</h2>
          <p className="text-[var(--text-secondary)]">Choose a class to manage grades for quizzes, activities, and exams</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => {
            const studentCount = getStudents(classItem.id).length;
            
            return (
              <div key={classItem.id} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onClassSelect(classItem)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{classItem.name}</h3>
                    <p className="text-[var(--text-secondary)]">{classItem.subject}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded text-[var(--text-secondary)]">Year {classItem.grade}</span>
                      <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-600 font-medium">{classItem.schoolYear}</span>
                      <span className="text-xs bg-indigo-50 px-2 py-1 rounded text-indigo-600 font-medium">{classItem.semester}</span>
                    </div>
                  </div>
                  <div className="icon-calculator text-2xl text-[var(--primary-color)]"></div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Students: {studentCount}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--text-secondary)]">Join Code:</p>
                    <span className="font-mono bg-[var(--primary-color)] text-white px-3 py-1 rounded-lg text-sm font-semibold tracking-wider">
                      {classItem.joinCode}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ClassSelector component error:', error);
    return null;
  }
}