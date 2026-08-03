function AttendanceTracker({ classData }) {
  try {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = React.useState([]);
  const [attendanceRecords, setAttendanceRecords] = React.useState([]);
  const [selectedSession, setSelectedSession] = React.useState('AM');
    const [showStudentForm, setShowStudentForm] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState(null);
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [showExcelModal, setShowExcelModal] = React.useState(false);
    const [availableClasses, setAvailableClasses] = React.useState([]);
    const [setSelectedStudentsForBulk] = React.useState(new Set()); // This was a mistake in my previous diff, fixed here
    const [selectedStudentsForBulk, setSelectedStudentsState] = React.useState(new Set());
    const [editingName, setEditingName] = React.useState(null);
    const [tempName, setTempName] = React.useState('');
    const [isFaceMode, setIsFaceMode] = React.useState(null); // 'register' or 'verify'
  const [faceTargetStudent, setFaceTargetStudent] = React.useState(null);

    React.useEffect(() => {
      const init = async () => {
        await loadStudents();
        await loadAttendanceForDate();
        await loadAvailableClasses();
      };
      init();
    }, [classData.id, selectedDate, selectedSession]);

    const loadStudents = async () => {
      try {
        const classStudents = await getStudents(classData.id);
        if (Array.isArray(classStudents)) {
          const sortedStudents = [...classStudents].sort((a, b) => a.name.localeCompare(b.name));
          setStudents(sortedStudents);
          checkAttendanceThreshold(sortedStudents);
        }
      } catch (error) {
        console.error("Error loading students in tracker:", error);
      }
    };

    const checkAttendanceThreshold = (students) => {
      const records = getAttendanceRecords(classData.id);
      students.forEach(student => {
        const studentRecords = records.filter(r => r.studentId === student.studentId);
        const absentCount = studentRecords.filter(r => r.status === 'absent').length;
        
        if (absentCount >= 10) {
          if (absentCount === 10) {
            setTimeout(() => {
              alert(`⚠️ ATTENDANCE THRESHOLD ALERT\n\nStudent: ${student.name}\nID: ${student.studentId}\nTotal Absences: ${absentCount}\n\nThis student has reached the attendance threshold limit.`);
            }, 1000);
          }
        }
      });
    };

    const loadAttendanceForDate = () => {
      const records = getAttendanceRecords(classData.id);
      const dateRecords = records.filter(r => r.date === selectedDate && (r.session || 'AM') === selectedSession);
      setAttendanceRecords(dateRecords);
    };

    const markAttendance = (studentId, status) => {
      const studentIds = Array.isArray(studentId) ? studentId : [studentId];
      const timestamp = new Date().toISOString();

      studentIds.forEach(id => {
        const existingRecord = getAttendanceRecords(classData.id).find(r => r.studentId === id && r.date === selectedDate && (r.session || 'AM') === selectedSession);
        
        if (existingRecord) {
          const updatedRecord = { ...existingRecord, status, timestamp };
          updateAttendanceRecord(classData.id, updatedRecord);
        } else {
          const newRecord = {
            id: `${Date.now()}_${id}_${selectedSession}`,
            classId: classData.id,
            studentId: id,
            date: selectedDate,
            session: selectedSession,
            status,
            timestamp
          };
          saveAttendanceRecord(classData.id, newRecord);
        }

        if (status === 'absent') {
          const studentRecords = getAttendanceRecords(classData.id).filter(r => r.studentId === id);
          const absentCount = studentRecords.filter(r => r.status === 'absent').length;
          if (absentCount === 10) {
            const student = students.find(s => s.studentId === id);
            setTimeout(() => {
              alert(`⚠️ THRESHOLD ALERT: ${student?.name} has reached 10 absences.`);
            }, 500);
          }
        }
      });
      
      loadAttendanceForDate();
      setSelectedStudentsState(new Set());
    };

    const handleBulkMark = (status) => {
      if (selectedStudentsForBulk.size === 0) {
        alert("Please select students first");
        return;
      }
      markAttendance(Array.from(selectedStudentsForBulk), status);
    };

    const toggleStudentSelection = (studentId) => {
      const next = new Set(selectedStudentsForBulk);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      setSelectedStudentsState(next);
    };

    const toggleAllSelection = () => {
      if (selectedStudentsForBulk.size === students.length) {
        setSelectedStudentsState(new Set());
      } else {
        setSelectedStudentsState(new Set(students.map(s => s.studentId)));
      }
    };

    const getAttendanceStatus = (studentId) => {
      const record = attendanceRecords.find(r => r.studentId === studentId);
      return record ? record.status : null;
    };

  const getAttendanceTime = (studentId) => {
    const record = attendanceRecords.find(r => r.studentId === studentId);
    return record ? new Date(record.timestamp).toLocaleTimeString() : null;
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleStudentFormClose = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    loadStudents();
  };

    const loadAvailableClasses = () => {
      const teacherEmail = classData.teacherEmail || 'teacher@school.edu';
      const teacherClasses = getClassesByTeacher(teacherEmail);
      const otherClasses = teacherClasses.filter(c => c.id !== classData.id);
      setAvailableClasses(otherClasses);
    };

    const handleDeleteStudent = (studentId) => {
      if (confirm('Are you sure you want to remove this student from the class?')) {
        deleteStudent(classData.id, studentId);
        loadStudents();
        loadAttendanceForDate();
      }
    };

    const handleImportStudents = (sourceClassId, selectedStudentIds) => {
      const sourceStudents = getStudents(sourceClassId);
      const currentStudents = getStudents(classData.id);
      const currentStudentIds = new Set(currentStudents.map(s => s.studentId));
      
      let importedCount = 0;
      selectedStudentIds.forEach(studentId => {
        const sourceStudent = sourceStudents.find(s => s.id === studentId);
        if (sourceStudent && !currentStudentIds.has(sourceStudent.studentId)) {
          const newStudent = {
            ...sourceStudent,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            joinDate: new Date().toISOString()
          };
          saveStudent(classData.id, newStudent);
          importedCount++;
        }
      });
      
      if (importedCount > 0) {
        loadStudents();
        alert(`Successfully imported ${importedCount} students`);
      } else {
        alert('No new students to import (students may already exist in this class)');
      }
      setShowImportModal(false);
    };

    const handleStartNameEdit = (student) => {
      setEditingName(student.id);
      setTempName(student.name);
    };

    const handleSaveNameEdit = (student) => {
      if (tempName.trim()) {
        const updatedStudent = {
          ...student,
          name: tempName.trim()
        };
        saveStudent(classData.id, updatedStudent);
        loadStudents();
        loadAttendanceForDate();
      }
      setEditingName(null);
      setTempName('');
    };

    const handleCancelEdit = () => {
      setEditingName(null);
      setTempName('');
    };

    const handleFaceRegister = (student) => {
      setFaceTargetStudent(student);
      setIsFaceMode('register');
    };

    const handleFaceSuccess = (faceData, isRegistration) => {
      if (isRegistration && faceTargetStudent) {
        localStorage.setItem(`face_profile_${faceTargetStudent.studentId}`, JSON.stringify(faceData));
        alert(`Face profile registered for ${faceTargetStudent.name}`);
      } else if (faceTargetStudent) {
        markAttendance(faceTargetStudent.studentId, 'present');
      }
      setIsFaceMode(null);
      setFaceTargetStudent(null);
    };

    return (
      <div className="space-y-6" data-name="attendance-tracker" data-file="components/AttendanceTracker.js">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field w-auto"
              />
            </div>
            {getSessions().length > 1 && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Session
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="input-field w-auto"
                >
                  {getSessions().map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadStudents}
              className="btn btn-secondary flex items-center gap-2"
              title="Refresh student list"
            >
              <div className="icon-refresh-cw text-lg"></div>
              Refresh
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary flex items-center gap-2"
              title="Import from another class"
            >
              <div className="icon-users text-lg"></div>
              Import
            </button>
            <button
              onClick={() => setShowExcelModal(true)}
              className="btn btn-secondary flex items-center gap-2"
              title="Import from Excel/CSV file"
            >
              <div className="icon-file-spreadsheet text-lg"></div>
              Excel Import
            </button>
            <button
              onClick={() => setShowStudentForm(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <div className="icon-user-plus text-lg"></div>
              Add Student
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="card text-center">
            <div className="icon-users text-4xl text-[var(--text-secondary)] mb-4"></div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Students Enrolled</h3>
            <p className="text-[var(--text-secondary)]">Add students manually or share the join code</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm font-bold text-blue-700">Bulk Actions:</span>
              <button onClick={() => handleBulkMark('present')} className="attendance-btn attendance-present py-1.5">Present</button>
              <button onClick={() => handleBulkMark('late')} className="attendance-btn attendance-late py-1.5">Late</button>
              <button onClick={() => handleBulkMark('excuse')} className="attendance-btn attendance-excuse py-1.5">Excuse</button>
              <button onClick={() => handleBulkMark('absent')} className="attendance-btn attendance-absent py-1.5">Absent</button>
              <div className="h-6 w-px bg-blue-200 mx-2"></div>
              <button 
                onClick={() => {
                  if (confirm('Clear attendance for selected students?')) {
                    const ids = Array.from(selectedStudentsForBulk);
                    ids.forEach(id => deleteSingleAttendanceRecord(classData.id, id, selectedDate, selectedSession));
                    loadAttendanceForDate();
                    setSelectedStudentsState(new Set());
                  }
                }} 
                className="attendance-btn bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 py-1.5"
              >
                Clear/Unmark
              </button>
            </div>

            <div className="card !p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-gray-50">
                    <th className="py-4 px-4 text-center w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentsForBulk.size === students.length && students.length > 0} 
                        onChange={toggleAllSelection}
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="text-left py-4 px-4 font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">Student Name</th>
                    <th className="text-left py-4 px-4 font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">Student ID</th>
                    <th className="text-center py-4 px-4 font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                    <th className="text-center py-4 px-4 font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">Time</th>
                    <th className="text-right py-4 px-6 font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const status = getAttendanceStatus(student.studentId);
                    const time = getAttendanceTime(student.studentId);
                    
                    return (
                      <tr key={student.id} className={`border-b border-[var(--border-color)] transition-colors ${selectedStudentsForBulk.has(student.studentId) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <td className="py-4 px-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedStudentsForBulk.has(student.studentId)}
                            onChange={() => toggleStudentSelection(student.studentId)}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="py-4 px-4">
                          {editingName === student.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="text-sm border border-[var(--border-color)] rounded px-2 py-1 font-medium"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') handleSaveNameEdit(student);
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveNameEdit(student)}
                                className="text-green-600 hover:bg-green-50 p-1 rounded"
                              >
                                <div className="icon-check text-sm"></div>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-400 hover:bg-gray-50 p-1 rounded"
                              >
                                <div className="icon-x text-sm"></div>
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="font-medium text-[var(--text-primary)] cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                              onClick={() => handleStartNameEdit(student)}
                              title="Click to edit name"
                            >
                              {student.name}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-mono text-xs text-gray-500">{student.studentId}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {status ? (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              status === 'present' ? 'bg-green-100 text-green-700' :
                              status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                              status === 'excuse' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {status}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-300 uppercase italic">Unmarked</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-[10px] text-gray-400">
                          {time || '--:--'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1">
                            {status && (
                              <button 
                                onClick={() => {
                                  if (confirm('Clear this attendance mark?')) {
                                    deleteSingleAttendanceRecord(classData.id, student.studentId, selectedDate, selectedSession);
                                    loadAttendanceForDate();
                                  }
                                }} 
                                className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg" 
                                title="Unmark / Cancel"
                              >
                                <div className="icon-x-circle text-sm"></div>
                              </button>
                            )}
                            <button onClick={() => handleFaceRegister(student)} className="p-1.5 hover:bg-indigo-50 text-indigo-500 rounded-lg" title="Face Enroll"><div className="icon-user-round text-sm"></div></button>
                            <button onClick={() => handleEditStudent(student)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg" title="Edit"><div className="icon-pencil text-sm"></div></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showStudentForm && (
          <StudentForm
            classId={classData.id}
            studentData={editingStudent}
            onSave={handleStudentFormClose}
            onCancel={handleStudentFormClose}
          />
        )}

        {showImportModal && (
          <StudentImportModal
            availableClasses={availableClasses}
            onImport={handleImportStudents}
            onCancel={() => setShowImportModal(false)}
            teacherEmail={classData.teacherEmail || 'teacher@school.edu'}
          />
        )}

        {showExcelModal && (
          <ExcelImportModal
            classId={classData.id}
            onImport={() => {
              setShowExcelModal(false);
              loadStudents();
            }}
            onCancel={() => setShowExcelModal(false)}
          />
        )}

        {isFaceMode && faceTargetStudent && (
          <FaceRecognition 
            mode={isFaceMode}
            studentId={faceTargetStudent.studentId}
            onSuccess={handleFaceSuccess}
            onCancel={() => {
              setIsFaceMode(null);
              setFaceTargetStudent(null);
            }}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('AttendanceTracker component error:', error);
    return null;
  }
}