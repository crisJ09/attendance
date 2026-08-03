function ClassForm({ classData, onSave, onCancel, teacherEmail }) {
  try {
    const [formData, setFormData] = React.useState({
      name: '',
      subject: '',
      grade: '',
      campus: 'Bangued',
      schoolYear: '2024-2025',
      semester: '1st Semester',
      // schedule will store an object mapping day keys to their specific settings
      schedule: {
        'Mon': { enabled: false, sessions: [{ id: Date.now() + 1, startTime: '08:00', endTime: '10:00' }] },
        'Tue': { enabled: false, sessions: [{ id: Date.now() + 2, startTime: '08:00', endTime: '10:00' }] },
        'Wed': { enabled: false, sessions: [{ id: Date.now() + 3, startTime: '08:00', endTime: '10:00' }] },
        'Thu': { enabled: false, sessions: [{ id: Date.now() + 4, startTime: '08:00', endTime: '10:00' }] },
        'Fri': { enabled: false, sessions: [{ id: Date.now() + 5, startTime: '08:00', endTime: '10:00' }] },
        'Sat': { enabled: false, sessions: [{ id: Date.now() + 6, startTime: '08:00', endTime: '10:00' }] },
        'Sun': { enabled: false, sessions: [{ id: Date.now() + 7, startTime: '08:00', endTime: '10:00' }] }
      },
      description: ''
    });
    const [error, setError] = React.useState('');

    React.useEffect(() => {
      if (classData) {
        const initialSchedule = {
          'Mon': { enabled: false, sessions: [{ id: 1, startTime: '08:00', endTime: '10:00' }] },
          'Tue': { enabled: false, sessions: [{ id: 2, startTime: '08:00', endTime: '10:00' }] },
          'Wed': { enabled: false, sessions: [{ id: 3, startTime: '08:00', endTime: '10:00' }] },
          'Thu': { enabled: false, sessions: [{ id: 4, startTime: '08:00', endTime: '10:00' }] },
          'Fri': { enabled: false, sessions: [{ id: 5, startTime: '08:00', endTime: '10:00' }] },
          'Sat': { enabled: false, sessions: [{ id: 6, startTime: '08:00', endTime: '10:00' }] },
          'Sun': { enabled: false, sessions: [{ id: 7, startTime: '08:00', endTime: '10:00' }] }
        };

        if (classData.schedule) {
          Object.keys(classData.schedule).forEach(day => {
            const dayData = classData.schedule[day];
            // Migration: handle if old schedule format only had startTime/endTime
            if (dayData.startTime && !dayData.sessions) {
              initialSchedule[day] = {
                enabled: dayData.enabled,
                sessions: [{ id: Date.now() + Math.random(), startTime: dayData.startTime, endTime: dayData.endTime }]
              };
            } else if (dayData.sessions) {
              initialSchedule[day] = dayData;
            }
          });
        } else if (classData.days) {
          classData.days.forEach(day => {
            if (initialSchedule[day]) {
              initialSchedule[day].enabled = true;
              initialSchedule[day].sessions = [{ id: Date.now() + Math.random(), startTime: classData.startTime || '08:00', endTime: classData.endTime || '10:00' }];
            }
          });
        }

        setFormData({
          name: classData.name || '',
          subject: classData.subject || '',
          grade: classData.grade || '',
          campus: classData.campus || 'Bangued',
          schoolYear: classData.schoolYear || '2024-2025',
          semester: classData.semester || '1st Semester',
          schedule: initialSchedule,
          description: classData.description || ''
        });
      }
    }, [classData]);

    const handleDayToggle = (day) => {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            enabled: !prev.schedule[day].enabled
          }
        }
      }));
    };

    const handleAddSession = (day) => {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            sessions: [
              ...prev.schedule[day].sessions,
              { id: Date.now(), startTime: '08:00', endTime: '10:00' }
            ]
          }
        }
      }));
    };

    const handleRemoveSession = (day, sessionId) => {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            sessions: prev.schedule[day].sessions.filter(s => s.id !== sessionId)
          }
        }
      }));
    };

    const handleSessionTimeChange = (day, sessionId, field, value) => {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            sessions: prev.schedule[day].sessions.map(s => 
              s.id === sessionId ? { ...s, [field]: value } : s
            )
          }
        }
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      setError('');

      const enabledDays = Object.keys(formData.schedule).filter(d => formData.schedule[d].enabled);

      if (!formData.name.trim() || !formData.subject.trim() || !formData.grade.trim() || !formData.campus || !formData.schoolYear || !formData.semester) {
        setError('Please fill in all required fields');
        return;
      }

      if (enabledDays.length === 0) {
        setError('Please select at least one day for the class schedule');
        return;
      }

      // Check if any enabled day has invalid times or no sessions
      for (const day of enabledDays) {
        const daySessions = formData.schedule[day].sessions;
        if (daySessions.length === 0) {
          setError(`Please add at least one session for ${day}`);
          return;
        }
        for (const session of daySessions) {
          if (session.startTime >= session.endTime) {
            setError(`End time must be after start time for a session on ${day}`);
            return;
          }
        }
      }

      const representativeSession = formData.schedule[enabledDays[0]].sessions[0];

      const classObj = {
        id: classData?.id || Date.now().toString(),
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        grade: formData.grade.trim(),
        campus: formData.campus,
        schoolYear: formData.schoolYear,
        semester: formData.semester,
        schedule: formData.schedule,
        days: enabledDays,
        startTime: representativeSession.startTime,
        endTime: representativeSession.endTime,
        description: formData.description.trim(),
        joinCode: classData?.joinCode || generateJoinCode(),
        teacherEmail: teacherEmail || classData?.teacherEmail || 'teacher@school.edu',
        createdAt: classData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveClass(classObj);
      onSave();
    };

    const generateJoinCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="class-form" data-file="components/ClassForm.js">
        <div className="card max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {classData ? 'Edit Class' : 'Create New Class'}
            </h2>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Math 101"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Campus *
                </label>
                <select
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Lagangilang">Lagangilang</option>
                  <option value="Bangued">Bangued</option>
                  <option value="La Paz">La Paz</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Year Level *
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  School Year *
                </label>
                <select
                  value={formData.schoolYear}
                  onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Semester *
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Class Schedule (Per Day Configuration)</label>
              
              <div className="space-y-3">
                {Object.keys(formData.schedule).map(day => (
                  <div key={day} className={`p-4 rounded-xl border transition-all ${formData.schedule[day].enabled ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleDayToggle(day)}
                            className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${
                              formData.schedule[day].enabled 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {formData.schedule[day].enabled && <div className="icon-check text-sm"></div>}
                          </button>
                          <span className={`font-bold ${formData.schedule[day].enabled ? 'text-blue-700' : 'text-slate-500'}`}>{day}</span>
                        </div>
                        {formData.schedule[day].enabled && (
                          <button
                            type="button"
                            onClick={() => handleAddSession(day)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                          >
                            <div className="icon-plus text-xs"></div>
                            Add Session
                          </button>
                        )}
                      </div>

                      {formData.schedule[day].enabled ? (
                        <div className="space-y-3 pl-9">
                          {formData.schedule[day].sessions.map((session, sIdx) => (
                            <div key={session.id} className="flex items-center gap-4">
                              <div className="grid grid-cols-2 gap-4 flex-1">
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400">From</label>
                                  <input
                                    type="time"
                                    value={session.startTime}
                                    onChange={(e) => handleSessionTimeChange(day, session.id, 'startTime', e.target.value)}
                                    className="input-field py-1 text-sm !bg-white"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400">To</label>
                                  <input
                                    type="time"
                                    value={session.endTime}
                                    onChange={(e) => handleSessionTimeChange(day, session.id, 'endTime', e.target.value)}
                                    className="input-field py-1 text-sm !bg-white"
                                  />
                                </div>
                              </div>
                              {formData.schedule[day].sessions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSession(day, session.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <div className="icon-trash-2 text-sm"></div>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pl-9 text-slate-400 text-xs italic">Disabled</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="2"
                placeholder="Optional class description"
              />
            </div>

            {error && (
              <div className="text-[var(--danger-color)] text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2">
                <div className="icon-circle-alert"></div>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4 shrink-0">
              <button type="button" onClick={onCancel} className="btn btn-secondary flex-1 py-3">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary flex-1 py-3">
                {classData ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ClassForm component error:', error);
    return null;
  }
}