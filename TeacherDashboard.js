function TeacherDashboard({ user, onLogout }) {
  try {
    const [activeView, setActiveView] = React.useState('classes');
    const [selectedClass, setSelectedClass] = React.useState(null);
    const [classes, setClasses] = React.useState([]);
    const [filteredClasses, setFilteredClasses] = React.useState([]);
    const [selectedCampus, setSelectedCampus] = React.useState('all');
    const [selectedSchoolYear, setSelectedSchoolYear] = React.useState('all');
    const [selectedSemester, setSelectedSemester] = React.useState('all');
    const [classFilterId, setClassFilterId] = React.useState('all');
    const [showClassForm, setShowClassForm] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState(null);
  const [showJoinQR, setShowJoinQR] = React.useState(null);
  const [isGlobalScanning, setIsGlobalScanning] = React.useState(false);
  const [isGlobalFaceScanning, setIsGlobalFaceScanning] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

    const [isConnecting, setIsConnecting] = React.useState(false);

    React.useEffect(() => {
      const refreshClasses = async () => {
        try {
          setIsConnecting(true);
          const teacherClasses = await getClassesByTeacher(user.email);
          if (Array.isArray(teacherClasses)) {
            const sorted = [...teacherClasses].sort((a, b) => {
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setClasses(prev => {
              if (JSON.stringify(prev) === JSON.stringify(sorted)) return prev;
              return sorted;
            });
          }
          setIsConnecting(false);
        } catch (error) {
          console.error("Error refreshing classes:", error);
          setIsConnecting(false);
        }
      };

      refreshClasses();
      
      const handleSync = (e) => {
        if (!e.key || e.key === 'attendanceClasses' || e.key.startsWith('students_')) {
          refreshClasses();
        }
      };
      
      window.addEventListener('storage', handleSync);
      
      const unsubscribe = subscribeToStorage((key) => {
        if (key === 'attendanceClasses' || !key) {
          refreshClasses();
        }
      });
      
      const interval = setInterval(refreshClasses, 2000);
      
      return () => {
        window.removeEventListener('storage', handleSync);
        unsubscribe();
        clearInterval(interval);
      };
    }, [user.email]);

    React.useEffect(() => {
      let filtered = Array.isArray(classes) ? [...classes] : [];

      // Filter by active or archived view
      if (activeView === 'archive') {
        filtered = filtered.filter(c => c.isArchived === true);
      } else if (activeView === 'classes') {
        filtered = filtered.filter(c => c.isArchived !== true);
      }

      if (selectedCampus !== 'all') {
        filtered = filtered.filter(c => c.campus === selectedCampus);
      }
      if (selectedSchoolYear !== 'all') {
        filtered = filtered.filter(c => c.schoolYear === selectedSchoolYear);
      }
      if (selectedSemester !== 'all') {
        filtered = filtered.filter(c => c.semester === selectedSemester);
      }
      if (classFilterId !== 'all') {
        filtered = filtered.filter(c => c.id === classFilterId);
      }
      
      setFilteredClasses(prev => {
        if (JSON.stringify(prev) === JSON.stringify(filtered)) return prev;
        return filtered;
      });
      
      setCurrentPage(1);
    }, [classes, selectedCampus, selectedSchoolYear, selectedSemester, classFilterId, activeView]);

    const handleClassUpdate = () => {
      const updatedClasses = getClassesByTeacher(user.email);
      setClasses(updatedClasses);
      setShowClassForm(false);
      setEditingClass(null);
    };

    const handleDeleteClass = (classId) => {
      if (confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
        deleteClass(classId);
        const updatedClasses = getClassesByTeacher(user.email);
        setClasses(updatedClasses);
        if (selectedClass && selectedClass.id === classId) {
          setSelectedClass(null);
          setActiveView('classes');
        }
      }
    };

  const handleEditClass = (classData) => {
    setEditingClass(classData);
    setShowClassForm(true);
  };

  const handleGlobalScanSuccess = (decodedData) => {
    setIsGlobalScanning(false);
    
    if (decodedData.type !== 'student_pass' || !decodedData.studentId) {
      alert("Invalid QR Code. Please ensure the student is showing their 'Student ID QR Pass'.");
      return;
    }

    const { studentId, studentName } = decodedData;
    const today = new Date().toISOString().split('T')[0];
    const session = new Date().getHours() < 12 ? 'AM' : 'PM';
    
    const teacherClasses = getClassesByTeacher(user.email);
    let markedCount = 0;
    
    teacherClasses.forEach(cls => {
      const students = getStudents(cls.id);
      const isEnrolled = students.some(s => String(s.studentId).trim().toUpperCase() === String(studentId).trim().toUpperCase());
      
      if (isEnrolled) {
        const record = {
          id: `${Date.now()}_scan_${studentId}_${cls.id}`,
          classId: cls.id,
          studentId,
          date: today,
          session,
          status: 'present',
          method: 'qr_pass_scan',
          timestamp: new Date().toISOString()
        };
        saveAttendanceRecord(cls.id, record);
        markedCount++;
      }
    });

    if (markedCount > 0) {
      alert(`Success! Marked attendance for ${studentName} in ${markedCount} classes.`);
    } else {
      alert(`${studentName} is not enrolled in any of your active classes.`);
    }
  };

  const handleGlobalFaceSuccess = (descriptor) => {
    setIsGlobalFaceScanning(false);
    
    const teacherClasses = getClassesByTeacher(user.email);
    const allUniqueStudents = new Map();
    teacherClasses.forEach(cls => {
      getStudents(cls.id).forEach(s => allUniqueStudents.set(String(s.studentId).trim().toUpperCase(), s.name));
    });

    let matchFoundId = null;
    
    for (const [sId] of allUniqueStudents) {
      const savedDescriptorRaw = localStorage.getItem(`face_profile_${sId}`);
      if (savedDescriptorRaw) {
        const savedDescriptor = new Float32Array(JSON.parse(savedDescriptorRaw));
        const distance = faceapi.euclideanDistance(descriptor, savedDescriptor);
        if (distance < 0.6) {
          matchFoundId = sId;
          break;
        }
      }
    }

    if (matchFoundId) {
      const today = new Date().toISOString().split('T')[0];
      const session = new Date().getHours() < 12 ? 'AM' : 'PM';
      let markedCount = 0;
      const studentName = allUniqueStudents.get(matchFoundId);

      teacherClasses.forEach(cls => {
        const students = getStudents(cls.id);
        const isEnrolled = students.some(s => String(s.studentId).trim().toUpperCase() === matchFoundId);
        
        if (isEnrolled) {
          const record = {
            id: `${Date.now()}_face_global_${matchFoundId}_${cls.id}`,
            classId: cls.id,
            studentId: matchFoundId,
            date: today,
            session,
            status: 'present',
            method: 'biometric_global',
            timestamp: new Date().toISOString()
          };
          saveAttendanceRecord(cls.id, record);
          markedCount++;
        }
      });

      alert(`Face Recognized! Attendance marked for ${studentName} in ${markedCount} classes.`);
    } else {
      alert("Face not recognized in your student records.");
    }
  };

    const sidebarItems = [
      { id: 'classes', label: 'Active Classes', icon: 'book-open' },
      { id: 'archive', label: 'Archive', icon: 'folder' },
      { id: 'sessions', label: 'Manage Sessions', icon: 'clock' },
      { id: 'attendance', label: 'Mark Attendance', icon: 'circle-check', disabled: !selectedClass },
      { id: 'history', label: 'Attendance History', icon: 'calendar', disabled: !selectedClass },
      { id: 'reports', label: 'Generate Reports', icon: 'file-text', disabled: !selectedClass }
    ];

    return (
      <div className="flex h-screen bg-gray-50" data-name="teacher-dashboard" data-file="components/TeacherDashboard.js">
        {/* Sidebar */}
        <div className="w-[var(--sidebar-width)] bg-white border-r border-[var(--border-color)] flex flex-col">
          <div className="p-6 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Teacher Panel</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{user.name}</p>
          </div>

          <div className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.disabled && setActiveView(item.id)}
                className={`sidebar-item ${activeView === item.id ? 'active' : ''} ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {activeView === 'classes' && 'Class Management'}
                  {activeView === 'archive' && 'Archived Classes'}
                  {activeView === 'sessions' && 'Session Management'}
                  {activeView === 'attendance' && 'Mark Attendance'}
                  {activeView === 'history' && 'Attendance History'}
                  {activeView === 'reports' && 'Generate Reports'}
                </h1>
                {selectedClass && (
                  <p className="text-[var(--text-secondary)] mt-1">
                    Current Class: {selectedClass.name} - {selectedClass.subject}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsGlobalScanning(true)}
                  className="btn btn-secondary flex items-center gap-2 border-2 border-indigo-200 hover:bg-indigo-50"
                  title="Scan Student QR Pass"
                >
                  <div className="icon-qr-code text-lg text-indigo-600"></div>
                  Scan Student QR
                </button>
                <button
                  onClick={() => setIsGlobalFaceScanning(true)}
                  className="btn btn-secondary flex items-center gap-2 border-2 border-blue-200 hover:bg-blue-50"
                  title="Scan Face for All Classes"
                >
                  <div className="icon-scan text-lg text-blue-600"></div>
                  Face Scan
                </button>
                <button
                  onClick={() => window.location.href = 'grading.html'}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <div className="icon-calculator text-lg"></div>
                  Grade Management
                </button>
                {activeView === 'classes' && (
                  <button
                    onClick={() => setShowClassForm(true)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <div className="icon-plus text-lg"></div>
                    Add Class
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {activeView === 'sessions' && (
              <SessionManager onStatsUpdate={() => {}} />
            )}

            {(activeView === 'classes' || activeView === 'archive') && (
              <div className="space-y-6">
                <div className="card mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Campus</label>
                      <select 
                        value={selectedCampus} 
                        onChange={(e) => setSelectedCampus(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Campuses</option>
                        <option value="Lagangilang">Lagangilang</option>
                        <option value="Bangued">Bangued</option>
                        <option value="La Paz">La Paz</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">School Year</label>
                      <select 
                        value={selectedSchoolYear} 
                        onChange={(e) => setSelectedSchoolYear(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Years</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Semester</label>
                      <select 
                        value={selectedSemester} 
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Semesters</option>
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                        <option value="Summer">Summer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Search Class</label>
                      <select 
                        value={classFilterId} 
                        onChange={(e) => setClassFilterId(e.target.value)}
                        className="input-field"
                      >
                        <option value="all">All Classes</option>
                        {classes
                          .filter(c => (selectedCampus === 'all' || c.campus === selectedCampus) && 
                                      (selectedSchoolYear === 'all' || c.schoolYear === selectedSchoolYear) &&
                                      (selectedSemester === 'all' || c.semester === selectedSemester))
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] bg-slate-50">
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Class Name</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Subject</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Year</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Campus</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Join Code</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Students</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Join QR</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)]">Full Schedule</th>
                          <th className="py-4 px-4 font-semibold text-[var(--text-primary)] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClasses.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="py-12 text-center text-[var(--text-secondary)]">
                              No {activeView === 'archive' ? 'archived' : ''} classes found matching your criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredClasses
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((classItem) => (
                            <tr key={classItem.id} className="border-b border-[var(--border-color)] hover:bg-slate-50 transition-colors group">
                              <td className="py-4 px-4">
                                <span 
                                  className="font-semibold text-[var(--text-primary)] cursor-pointer hover:text-[var(--primary-color)]"
                                  onClick={() => {
                                    setSelectedClass(classItem);
                                    setActiveView('attendance');
                                  }}
                                >
                                  {classItem.name}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-[var(--text-secondary)]">{classItem.subject}</td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs">Year {classItem.grade}</span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <div className="icon-map-pin text-xs text-[var(--primary-color)]"></div>
                                  {classItem.campus || 'Bangued'}
                                </div>
                              </td>
                              <td className="py-4 px-4 font-mono font-bold text-blue-600">{classItem.joinCode}</td>
                              <td className="py-4 px-4">
                                <span className="font-semibold">{getStudents(classItem.id).length}</span>
                              </td>
                              <td className="py-4 px-4">
                                <button
                                  onClick={() => setShowJoinQR(classItem)}
                                  className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                  title="Show Join QR Code"
                                >
                                  <div className="icon-user-plus text-xl"></div>
                                </button>
                              </td>
                              <td className="py-4 px-4 text-[var(--text-secondary)] text-xs">
                                {classItem.schedule ? (
                                  <div className="flex flex-col gap-0.5">
                                    {Object.keys(classItem.schedule)
                                      .filter(d => classItem.schedule[d].enabled)
                                      .map(d => (
                                        <div key={d} className="flex gap-1 whitespace-nowrap">
                                          <span className="font-bold text-blue-600">{d}:</span>
                                          <span>{classItem.schedule[d].startTime}-{classItem.schedule[d].endTime}</span>
                                        </div>
                                      ))
                                    }
                                  </div>
                                ) : (
                                  <span>{classItem.days?.join(', ') || 'N/A'}</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => {
                                      setSelectedClass(classItem);
                                      setActiveView('attendance');
                                    }}
                                    className="p-2 hover:bg-blue-50 text-[var(--primary-color)] rounded-lg"
                                    title="View Attendance"
                                  >
                                    <div className="icon-eye text-lg"></div>
                                  </button>
                                  <button
                                    onClick={() => handleEditClass(classItem)}
                                    className="p-2 hover:bg-slate-100 text-[var(--text-primary)] rounded-lg"
                                    title="Edit Class"
                                  >
                                    <div className="icon-pencil text-lg"></div>
                                  </button>
                                  {classItem.isArchived ? (
                                    <button
                                      onClick={() => {
                                        if (confirm('Restore this class to Active?')) {
                                          archiveClass(classItem.id, false);
                                          handleClassUpdate();
                                        }
                                      }}
                                      className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                                      title="Restore Class"
                                    >
                                      <div className="icon-rotate-ccw text-lg"></div>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (confirm('Archive this class? It will be moved to the Archive tab.')) {
                                          archiveClass(classItem.id, true);
                                          handleClassUpdate();
                                        }
                                      }}
                                      className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg"
                                      title="Archive Class"
                                    >
                                      <div className="icon-folder-archive text-lg"></div>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteClass(classItem.id)}
                                    className="p-2 hover:bg-red-100 text-[var(--danger-color)] rounded-lg"
                                    title="Delete Class"
                                  >
                                    <div className="icon-trash-2 text-lg"></div>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {filteredClasses.length > itemsPerPage && (
                    <div className="flex items-center justify-between mt-6 px-4">
                      <p className="text-sm text-[var(--text-secondary)]">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClasses.length)} of {filteredClasses.length} entries
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="btn btn-secondary py-1 px-3 disabled:opacity-50"
                        >
                          <div className="icon-chevron-left"></div>
                        </button>
                        <div className="flex items-center px-4 font-medium">
                          Page {currentPage} of {Math.ceil(filteredClasses.length / itemsPerPage)}
                        </div>
                        <button 
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredClasses.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(filteredClasses.length / itemsPerPage)}
                          className="btn btn-secondary py-1 px-3 disabled:opacity-50"
                        >
                          <div className="icon-chevron-right"></div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'attendance' && selectedClass && (
              <AttendanceTracker classData={selectedClass} />
            )}

            {activeView === 'history' && selectedClass && (
              <AttendanceHistory classData={selectedClass} />
            )}

            {activeView === 'reports' && selectedClass && (
              <ReportGenerator classData={selectedClass} />
            )}
          </div>
        </div>

        {showClassForm && (
          <ClassForm
            classData={editingClass}
            teacherEmail={user.email}
            onSave={handleClassUpdate}
            onCancel={() => {
              setShowClassForm(false);
              setEditingClass(null);
            }}
          />
        )}



        {showJoinQR && (
          <JoinQRCodeModal
            classData={showJoinQR}
            onCancel={() => setShowJoinQR(null)}
          />
        )}

        {isGlobalScanning && (
          <QRScanner 
            onScanSuccess={handleGlobalScanSuccess}
            onCancel={() => setIsGlobalScanning(false)}
          />
        )}

        {isGlobalFaceScanning && (
          <FaceRecognition 
            mode="scan"
            onSuccess={handleGlobalFaceSuccess}
            onCancel={() => setIsGlobalFaceScanning(false)}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('TeacherDashboard component error:', error);
    return null;
  }
}