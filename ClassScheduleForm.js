function ClassScheduleForm({ classData, onSave, onCancel }) {
  try {
    const [schedule, setSchedule] = React.useState({
      monday: { enabled: false, session: 'AM', startTime: '08:00', endTime: '12:00' },
      tuesday: { enabled: false, session: 'AM', startTime: '08:00', endTime: '12:00' },
      wednesday: { enabled: false, session: 'AM', startTime: '08:00', endTime: '12:00' },
      thursday: { enabled: false, session: 'AM', startTime: '08:00', endTime: '12:00' },
      friday: { enabled: false, session: 'AM', startTime: '08:00', endTime: '12:00' },
      saturday: { enabled: false, session: 'AM', startTime: '08:00', endTime: '12:00' },
      sunday: { enabled: false, session: 'AM', startTime: '08:00', endTime: '12:00' }
    });
    const [error, setError] = React.useState('');

    React.useEffect(() => {
      loadSchedule();
    }, [classData.id]);

    const loadSchedule = () => {
      const savedSchedule = localStorage.getItem(`schedule_${classData.id}`);
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule));
      }
    };

    const handleScheduleChange = (day, field, value) => {
      setSchedule(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value
        }
      }));
    };

    const handleSave = () => {
      setError('');
      
      // Validate that at least one day is enabled
      const hasEnabledDay = Object.values(schedule).some(day => day.enabled);
      if (!hasEnabledDay) {
        setError('Please enable at least one day for the class schedule');
        return;
      }

      // Validate time ranges for enabled days
      for (const [dayName, daySchedule] of Object.entries(schedule)) {
        if (daySchedule.enabled) {
          if (!daySchedule.startTime || !daySchedule.endTime) {
            setError(`Please set start and end times for ${dayName}`);
            return;
          }
          
          const start = new Date(`2000-01-01T${daySchedule.startTime}`);
          const end = new Date(`2000-01-01T${daySchedule.endTime}`);
          
          if (start >= end) {
            setError(`End time must be after start time for ${dayName}`);
            return;
          }
        }
      }

      localStorage.setItem(`schedule_${classData.id}`, JSON.stringify(schedule));
      onSave();
    };

    const sessions = getSessions();
    const weekdays = [
      { key: 'monday', name: 'Monday' },
      { key: 'tuesday', name: 'Tuesday' },
      { key: 'wednesday', name: 'Wednesday' },
      { key: 'thursday', name: 'Thursday' },
      { key: 'friday', name: 'Friday' },
      { key: 'saturday', name: 'Saturday' },
      { key: 'sunday', name: 'Sunday' }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="class-schedule-form" data-file="components/ClassScheduleForm.js">
        <div className="card max-w-3xl w-full max-h-[80vh] overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Class Schedule</h2>
              <p className="text-[var(--text-secondary)]">{classData.name} - {classData.subject}</p>
            </div>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Weekly Schedule</h3>
            
            {weekdays.map((day) => (
              <div key={day.key} className="border border-[var(--border-color)] rounded-lg p-4">
                <div className="flex items-center gap-4 mb-3">
                  <input
                    type="checkbox"
                    id={`${day.key}-enabled`}
                    checked={schedule[day.key].enabled}
                    onChange={(e) => handleScheduleChange(day.key, 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`${day.key}-enabled`} className="text-lg font-medium text-[var(--text-primary)]">
                    {day.name}
                  </label>
                </div>
                
                {schedule[day.key].enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Session</label>
                      <select
                        value={schedule[day.key].session}
                        onChange={(e) => handleScheduleChange(day.key, 'session', e.target.value)}
                        className="input-field"
                      >
                        {sessions.map((session) => (
                          <option key={session.id} value={session.id}>
                            {session.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Start Time</label>
                      <input
                        type="time"
                        value={schedule[day.key].startTime}
                        onChange={(e) => handleScheduleChange(day.key, 'startTime', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">End Time</label>
                      <input
                        type="time"
                        value={schedule[day.key].endTime}
                        onChange={(e) => handleScheduleChange(day.key, 'endTime', e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="text-[var(--danger-color)] text-sm bg-red-50 p-3 rounded-lg mt-4">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-[var(--border-color)] mt-6">
            <button onClick={onCancel} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary flex-1">
              Save Schedule
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ClassScheduleForm component error:', error);
    return null;
  }
}