function AttendanceHistory({ classData }) {
  try {
    const [dateRange, setDateRange] = React.useState('7');
    const [students, setStudents] = React.useState([]);
    const [attendanceData, setAttendanceData] = React.useState([]);
    const [editingRecord, setEditingRecord] = React.useState(null);
    const [showEditModal, setShowEditModal] = React.useState(false);

    React.useEffect(() => {
      loadData();
    }, [classData.id, dateRange]);

    const loadData = () => {
      const classStudents = getStudents(classData.id);
      setStudents(classStudents);

      const records = getAttendanceRecords(classData.id);
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      setAttendanceData(filteredRecords);
    };

    const handleEditAttendance = (studentId, date, currentStatus) => {
      setEditingRecord({ studentId, date, currentStatus });
      setShowEditModal(true);
    };

    const handleUpdateAttendance = (newStatus) => {
      if (!editingRecord) return;

      const existingRecord = attendanceData.find(r => 
        r.studentId === editingRecord.studentId && r.date === editingRecord.date
      );

      if (existingRecord) {
        const updatedRecord = { 
          ...existingRecord, 
          status: newStatus, 
          timestamp: new Date().toISOString() 
        };
        updateAttendanceRecord(classData.id, updatedRecord);
      } else {
        const newRecord = {
          id: Date.now().toString(),
          classId: classData.id,
          studentId: editingRecord.studentId,
          date: editingRecord.date,
          status: newStatus,
          timestamp: new Date().toISOString(),
          session: 'AM'
        };
        saveAttendanceRecord(classData.id, newRecord);
      }

      setShowEditModal(false);
      setEditingRecord(null);
      loadData();
    };

    const handleDeleteAttendance = (studentId, date) => {
      if (confirm('Are you sure you want to delete this attendance record?')) {
        const recordToDelete = attendanceData.find(r => 
          r.studentId === studentId && r.date === date
        );
        
        if (recordToDelete) {
          deleteAttendanceRecord(classData.id, recordToDelete.id);
          loadData();
        }
      }
    };

    const handleDeleteAllForDate = (date) => {
      const dateString = new Date(date).toLocaleDateString();
      const recordCount = attendanceData.filter(r => r.date === date).length;
      
      if (confirm(`Are you sure you want to cancel all attendance records for ${dateString}?\n\nThis will remove ${recordCount} attendance record(s) for this date. This action cannot be undone.`)) {
        const recordsToDelete = attendanceData.filter(r => r.date === date);
        recordsToDelete.forEach(record => {
          deleteAttendanceRecord(classData.id, record.id);
        });
        loadData();
      }
    };

    const getAttendanceForStudent = (studentId) => {
      const studentRecords = attendanceData.filter(r => r.studentId === studentId);
      const total = studentRecords.length;
      const present = studentRecords.filter(r => r.status === 'present').length;
      const late = studentRecords.filter(r => r.status === 'late').length;
      const excuse = studentRecords.filter(r => r.status === 'excuse').length;
      const absent = studentRecords.filter(r => r.status === 'absent').length;
      
      const amRecords = studentRecords.filter(r => (r.session || 'AM') === 'AM');
      const pmRecords = studentRecords.filter(r => r.session === 'PM');
      
      return { total, present, late, excuse, absent, amRecords: amRecords.length, pmRecords: pmRecords.length };
    };

    const getUniqueAttendanceDates = () => {
      const dates = [...new Set(attendanceData.map(record => record.date))];
      return dates.sort().reverse();
    };

    const getStatusForDate = (studentId, date) => {
      const record = attendanceData.find(r => r.studentId === studentId && r.date === date);
      return record ? record.status : null;
    };

    return (
      <div className="space-y-6" data-name="attendance-history" data-file="components/AttendanceHistory.js">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field w-auto"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days (Monthly)</option>
              <option value="90">Last 90 days (Semestral)</option>
              <option value="180">Last 180 days (Full Semester)</option>
            </select>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="card text-center">
            <div className="icon-calendar text-4xl text-[var(--text-secondary)] mb-4"></div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Students Found</h3>
            <p className="text-[var(--text-secondary)]">Add students to view attendance history</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Attendance Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-center py-3 px-3 font-medium text-[var(--text-primary)] w-16">#</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Student</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Total</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Session 1</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Session 2</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Present</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Late</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Excuse</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Absent</th>
                      <th className="text-center py-3 px-4 font-medium text-[var(--text-primary)]">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const stats = getAttendanceForStudent(student.studentId);
                      const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                      
                      return (
                        <tr key={student.id} className="border-b border-[var(--border-color)]">
                          <td className="py-3 px-3 text-center text-[var(--text-secondary)] font-medium">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[var(--text-primary)]">{student.name}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{student.studentId}</div>
                          </td>
                          <td className="py-3 px-4 text-center">{stats.total}</td>
                          <td className="py-3 px-4 text-center text-blue-600">{stats.amRecords}</td>
                          <td className="py-3 px-4 text-center text-orange-600">{stats.pmRecords}</td>
                          <td className="py-3 px-4 text-center text-green-600">{stats.present}</td>
                          <td className="py-3 px-4 text-center text-yellow-600">{stats.late}</td>
                          <td className="py-3 px-4 text-center text-purple-600">{stats.excuse}</td>
                          <td className="py-3 px-4 text-center text-red-600">{stats.absent}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-medium ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Daily Attendance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-center py-3 px-3 font-medium text-[var(--text-primary)] w-16">#</th>
                      <th className="text-left py-3 px-4 font-medium text-[var(--text-primary)]">Student</th>
                      {getUniqueAttendanceDates().map(date => (
                        <th key={date} className="text-center py-3 px-2 font-medium text-[var(--text-primary)] min-w-24">
                          <div className="flex flex-col items-center gap-1">
                            <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <button
                              onClick={() => handleDeleteAllForDate(date)}
                              className="text-xs text-[var(--danger-color)] hover:bg-red-50 p-1 rounded"
                              title="Delete all records for this date"
                            >
                              <div className="icon-trash-2 text-xs"></div>
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className="border-b border-[var(--border-color)] group">
                        <td className="py-3 px-3 text-center text-[var(--text-secondary)] font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[var(--text-primary)]">{student.name}</div>
                        </td>
                        {getUniqueAttendanceDates().map(date => {
                          const status = getStatusForDate(student.studentId, date);
                          return (
                            <td key={date} className="py-3 px-2 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => handleEditAttendance(student.studentId, date, status)}
                                  className="hover:scale-110 transition-transform"
                                  title={`Click to edit attendance for ${student.name} on ${new Date(date).toLocaleDateString()}`}
                                >
                                  {status === 'present' && <div className="w-4 h-4 bg-green-500 rounded-full"></div>}
                                  {status === 'late' && <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>}
                                  {status === 'excuse' && <div className="w-4 h-4 bg-purple-500 rounded-full"></div>}
                                  {status === 'absent' && <div className="w-4 h-4 bg-red-500 rounded-full"></div>}
                                  {!status && <div className="w-4 h-4 bg-gray-200 rounded-full"></div>}
                                </button>
                                {status && (
                                  <button
                                    onClick={() => handleDeleteAttendance(student.studentId, date)}
                                    className="text-xs text-[var(--danger-color)] hover:bg-red-50 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete attendance record"
                                  >
                                    <div className="icon-x text-xs"></div>
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editingRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Edit Attendance Record
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Student: {students.find(s => s.studentId === editingRecord.studentId)?.name}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Date: {new Date(editingRecord.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Current Status: {editingRecord.currentStatus || 'Not marked'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleUpdateAttendance('present')}
                  className="btn btn-success w-full"
                >
                  Mark as Present
                </button>
                <button
                  onClick={() => handleUpdateAttendance('late')}
                  className="btn btn-warning w-full"
                >
                  Mark as Late
                </button>
                <button
                  onClick={() => handleUpdateAttendance('excuse')}
                  className="btn w-full bg-purple-600 text-white hover:bg-purple-700"
                >
                  Mark as Excuse
                </button>
                <button
                  onClick={() => handleUpdateAttendance('absent')}
                  className="btn btn-danger w-full"
                >
                  Mark as Absent
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRecord(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('AttendanceHistory component error:', error);
    return null;
  }
}
