function StudentDashboard({ user, onLogout }) {
  try {
    const [activeTab, setActiveTab] = React.useState('subjects');
    const [enrolledClasses, setEnrolledClasses] = React.useState([]);
    const [selectedClassId, setSelectedClassId] = React.useState(null);
    const [joinCode, setJoinCode] = React.useState('');
    const [enrollMethod, setEnrollMethod] = React.useState('manual');
    const [isScanning, setIsScanning] = React.useState(false);
    const [isFaceMode, setIsFaceMode] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const [profileData, setProfileData] = React.useState({
      name: user.name,
      studentId: user.studentId,
      email: `${user.studentId}@student.edu`
    });

    React.useEffect(() => {
      loadEnrolledClasses();
      const savedProfile = localStorage.getItem(`profile_${user.studentId}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }

      const handleSync = (e) => {
        if (!e.key || e.key === 'attendanceClasses' || e.key.startsWith('students_')) {
          loadEnrolledClasses();
        }
      };
      
      window.addEventListener('storage', handleSync);
      const unsubscribe = subscribeToStorage((key) => {
        if (key === 'attendanceClasses' || (key && key.startsWith('students_'))) {
          loadEnrolledClasses();
        }
      });

      const interval = setInterval(loadEnrolledClasses, 2000);

      return () => {
        window.removeEventListener('storage', handleSync);
        unsubscribe();
        clearInterval(interval);
      };
    }, []);

    const loadEnrolledClasses = async () => {
      try {
        const allClasses = await getClasses();
        const currentIdRaw = profileData?.studentId || user.studentId;
        const currentStudentId = String(currentIdRaw).trim().toUpperCase();
        
        const enrolled = [];
        for (const classItem of allClasses) {
          const students = await getStudents(classItem.id);
          const isEnrolled = students.some(student => 
            String(student.studentId).trim().toUpperCase() === currentStudentId
          );
          if (isEnrolled) {
            enrolled.push(classItem);
          }
        }

        setEnrolledClasses(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(enrolled)) {
            return enrolled;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error loading enrolled classes:', error);
      }
    };

    const handleJoinClass = async () => {
      setError('');
      setSuccess('');
      const normalizedInput = joinCode.trim().toUpperCase();
      if (!normalizedInput) {
        setError('Please enter a join code');
        return;
      }
      const allClasses = await getClasses();
      const targetClass = allClasses.find(c => {
        const code = c.joinCode ? String(c.joinCode).trim().toUpperCase() : '';
        return code === normalizedInput;
      });
      if (!targetClass) {
        setError('Invalid join code. Please check with your teacher.');
        return;
      }
      const students = await getStudents(targetClass.id);
      const currentStudentId = String(user.studentId).trim().toUpperCase();
      const alreadyEnrolled = students.some(s => 
        String(s.studentId).trim().toUpperCase() === currentStudentId
      );
      if (alreadyEnrolled) {
        setError('You are already enrolled in this class');
        return;
      }
      const newStudent = {
        id: Date.now().toString(),
        name: profileData.name,
        studentId: String(profileData.studentId).trim().toUpperCase(),
        email: profileData.email,
        joinDate: new Date().toISOString()
      };
      await saveStudent(targetClass.id, newStudent);
      setTimeout(async () => {
        await loadEnrolledClasses();
        setSuccess(`Successfully joined ${targetClass.name}!`);
        setJoinCode('');
      }, 150);
    };

    const handleScanSuccess = async (decodedData) => {
      setIsScanning(false);
      setError('');
      setSuccess('');

      if (decodedData.type === 'join_token') {
        const { classId, className } = decodedData;
        const students = await getStudents(classId);
        const alreadyEnrolled = students.some(s => 
          String(s.studentId).trim().toUpperCase() === String(user.studentId).trim().toUpperCase()
        );
        if (alreadyEnrolled) {
          setError(`You are already enrolled in ${className}`);
          return;
        }
        const newStudent = {
          id: Date.now().toString(),
          name: profileData.name,
          studentId: profileData.studentId,
          email: profileData.email,
          joinDate: new Date().toISOString()
        };
        await saveStudent(classId, newStudent);
        setTimeout(async () => {
          await loadEnrolledClasses();
          setSuccess(`Successfully joined ${className} via QR code!`);
        }, 100);
        return;
      }

      const { classId, className, session, date } = decodedData;
      const isEnrolled = enrolledClasses.some(c => String(c.id) === String(classId));
      if (!isEnrolled) {
        setError(`You are not enrolled in ${className}. Please join the class first.`);
        return;
      }

      // Schedule validation using the specific day's times
      const targetClass = enrolledClasses.find(c => String(c.id) === String(classId));
      if (targetClass) {
          const now = new Date();
          const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const currentDay = daysMap[now.getDay()];
          
          let scheduleForToday = null;
          if (targetClass.schedule && targetClass.schedule[currentDay] && targetClass.schedule[currentDay].enabled) {
              scheduleForToday = targetClass.schedule[currentDay];
          }

          if (!scheduleForToday && (!targetClass.days || !targetClass.days.includes(currentDay))) {
              setError(`Today (${currentDay}) is not a scheduled day for ${className}.`);
              return;
          }

          const currentTime = now.getHours() * 60 + now.getMinutes();
          let isTimeAllowed = false;
          let allowedWindows = [];

          if (scheduleForToday && scheduleForToday.sessions) {
              scheduleForToday.sessions.forEach(session => {
                  const [startH, startM] = session.startTime.split(':').map(Number);
                  const [endH, endM] = session.endTime.split(':').map(Number);
                  const startVal = startH * 60 + startM;
                  const endVal = endH * 60 + endM;
                  allowedWindows.push(`${session.startTime} - ${session.endTime}`);
                  if (currentTime >= startVal && currentTime <= endVal) {
                      isTimeAllowed = true;
                  }
              });
          } else if (targetClass.startTime && targetClass.endTime) {
              // Legacy fallback
              const [startH, startM] = targetClass.startTime.split(':').map(Number);
              const [endH, endM] = targetClass.endTime.split(':').map(Number);
              const startVal = startH * 60 + startM;
              const endVal = endH * 60 + endM;
              allowedWindows.push(`${targetClass.startTime} - ${targetClass.endTime}`);
              if (currentTime >= startVal && currentTime <= endVal) {
                  isTimeAllowed = true;
              }
          } else {
              // No specific time set, allow anytime on the day
              isTimeAllowed = true;
          }

          if (!isTimeAllowed) {
              setError(`Attendance for ${className} is only open during: ${allowedWindows.join(', ')}.`);
              return;
          }
      }

      const today = new Date().toISOString().split('T')[0];
      const record = {
        id: `${Date.now()}_${user.studentId}`,
        classId: classId,
        studentId: user.studentId,
        date: date || today,
        session: session || (new Date().getHours() < 12 ? 'AM' : 'PM'),
        status: 'present',
        method: 'qr_scan',
        timestamp: new Date().toISOString()
      };
      saveAttendanceRecord(classId, record);
      setSuccess(`Attendance marked for ${className} as present!`);
      loadEnrolledClasses();
    };

    const handleFaceScanSuccess = async (faceData, isRegistration = false) => {
      if (isRegistration) {
        localStorage.setItem(`face_profile_${user.studentId}`, JSON.stringify(faceData));
        setSuccess('Face profile registered successfully!');
        setIsScanning(false);
        return;
      }
      if (enrolledClasses.length === 0) {
        setError("You are not enrolled in any classes yet.");
        setIsScanning(false);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const session = new Date().getHours() < 12 ? 'AM' : 'PM';
      let markedCount = 0;
      const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const currentDay = daysMap[now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      for (const classItem of enrolledClasses) {
        let isTimeAllowed = false;
        
        let scheduleForToday = null;
        if (classItem.schedule && classItem.schedule[currentDay] && classItem.schedule[currentDay].enabled) {
            scheduleForToday = classItem.schedule[currentDay];
        } else if (classItem.days && classItem.days.includes(currentDay)) {
            scheduleForToday = { startTime: classItem.startTime, endTime: classItem.endTime };
        } else if (!classItem.days || classItem.days.length === 0) {
            isTimeAllowed = true;
        }

        if (scheduleForToday && scheduleForToday.sessions) {
            scheduleForToday.sessions.forEach(session => {
                const [startH, startM] = session.startTime.split(':').map(Number);
                const [endH, endM] = session.endTime.split(':').map(Number);
                const startVal = startH * 60 + startM;
                const endVal = endH * 60 + endM;
                if (currentTime >= startVal && currentTime <= endVal) {
                    isTimeAllowed = true;
                }
            });
        } else if (classItem.startTime && classItem.endTime) {
            const [startH, startM] = classItem.startTime.split(':').map(Number);
            const [endH, endM] = classItem.endTime.split(':').map(Number);
            const startVal = startH * 60 + startM;
            const endVal = endH * 60 + endM;
            if (currentTime >= startVal && currentTime <= endVal) {
                isTimeAllowed = true;
            }
        }
        if (isTimeAllowed) {
            const record = {
              id: `${Date.now()}_face_${user.studentId}_${classItem.id}`,
              classId: classItem.id,
              studentId: user.studentId,
              date: today,
              session: session,
              status: 'present',
              method: 'facial_recognition',
              timestamp: new Date().toISOString()
            };
            await saveAttendanceRecord(classItem.id, record);
            markedCount++;
        }
      }

      if (markedCount > 0) {
          setSuccess(`Face recognized! Marked attendance for ${markedCount} current classes.`);
      } else {
          setError("Face recognized, but no active classes were found for this specific time.");
      }
      await loadEnrolledClasses();
      setIsScanning(false);
    };

    const handleUpdateProfile = (e) => {
      e.preventDefault();
      localStorage.setItem(`profile_${user.studentId}`, JSON.stringify(profileData));
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    };

    const handleScanAttendance = () => {
      setError('');
      setSuccess('');
      setIsFaceMode(false);
      setIsScanning(true);
    };

    const getAttendanceStats = (classId) => {
      const records = getAttendanceRecords(classId);
      const studentRecords = records.filter(r => r.studentId === user.studentId);
      const total = studentRecords.length;
      const present = studentRecords.filter(r => r.status === 'present').length;
      const late = studentRecords.filter(r => r.status === 'late').length;
      const excuse = studentRecords.filter(r => r.status === 'excuse').length;
      return { total, present, late, excuse, absent: total - present - late - excuse };
    };

    const navItems = [
      { id: 'subjects', label: 'My Subjects', icon: 'book' },
      { id: 'enroll', label: 'Join Class', icon: 'circle-plus' },
      { id: 'qr-pass', label: 'My QR Pass', icon: 'qr-code' },
      { id: 'reports', label: 'Attendance Reports', icon: 'chart-bar' },
      { id: 'settings', label: 'Settings', icon: 'settings' }
    ];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" data-name="student-dashboard" data-file="components/StudentDashboard.js">
        <div className="w-full md:w-64 bg-white border-r border-[var(--border-color)] flex flex-col h-auto md:h-screen sticky top-0">
          <div className="p-6 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white">
                <div className="icon-user text-xl"></div>
              </div>
              <div>
                <h1 className="font-bold text-[var(--text-primary)] leading-tight">{profileData.name}</h1>
                <p className="text-xs text-[var(--text-secondary)]">{profileData.studentId}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedClassId(null);
                  setError('');
                  setSuccess('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-[var(--primary-color)]' 
                    : 'text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--text-primary)]'
                }`}
              >
                <div className={`icon-${item.icon} text-lg`}></div>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-[var(--border-color)]">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
              <div className="icon-log-out text-lg"></div>
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <header className="bg-white border-b border-[var(--border-color)] px-8 py-4 sticky top-0 z-10">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {selectedClassId ? 'Subject Details' : navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </header>
          <main className="p-8 max-w-5xl mx-auto">
            {activeTab === 'qr-pass' && (
              <div className="max-w-sm mx-auto space-y-6">
                <div className="card text-center bg-white p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Student ID Pass</h3>
                  <div className="bg-white p-4 rounded-2xl border-4 border-blue-50 flex justify-center mb-6">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({
                        type: 'student_pass',
                        studentId: user.studentId,
                        studentName: profileData.name
                      }))}`} 
                      alt="Student QR Pass" 
                      className="w-full aspect-square"
                    />
                  </div>
                  <p className="text-lg font-black text-blue-600 uppercase tracking-tight">{profileData.name}</p>
                  <p className="text-sm font-mono text-gray-400">{user.studentId}</p>
                </div>
              </div>
            )}
            {activeTab === 'enroll' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="card !p-0 overflow-hidden bg-white shadow-xl border-0">
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white">
                    <h3 className="text-2xl font-black mb-1">Class Enrollment</h3>
                    <p className="text-indigo-100 text-sm font-medium">Join your subjects to start tracking attendance</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="flex p-1 bg-gray-100 rounded-2xl mb-4">
                      <button onClick={() => setEnrollMethod('manual')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${enrollMethod === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-50'}`}><div className="flex items-center justify-center gap-2"><div className="icon-keyboard"></div>Manual</div></button>
                      <button onClick={() => setEnrollMethod('qr')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${enrollMethod === 'qr' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}><div className="flex items-center justify-center gap-2"><div className="icon-qr-code"></div>Scan QR</div></button>
                    </div>
                    {enrollMethod === 'manual' ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          placeholder="6-Digit Code"
                          className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-black tracking-widest text-center"
                          maxLength={6}
                        />
                        <button onClick={handleJoinClass} className="btn btn-primary w-full py-5 rounded-2xl font-black">Join Class</button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <button onClick={handleScanAttendance} className="w-full py-10 border-4 border-dashed border-gray-100 rounded-[2.5rem] hover:border-blue-400 flex flex-col items-center gap-4">
                          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center"><div className="icon-camera text-4xl text-blue-600"></div></div>
                          <p className="font-black text-xl text-gray-800">Launch Scanner</p>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'subjects' && (
              <div className="space-y-6">
                {enrolledClasses.length === 0 ? (
                  <div className="card text-center py-20">No Subjects Joined</div>
                ) : selectedClassId ? (
                  (() => {
                    const classItem = enrolledClasses.find(c => c.id === selectedClassId);
                    if (!classItem) return null;
                    const stats = getAttendanceStats(classItem.id);
                    const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                    return (
                      <div className="space-y-6">
                        <button onClick={() => setSelectedClassId(null)} className="text-blue-600 font-bold mb-4">Back to Subjects</button>
                        <div className="card bg-white p-6 border-2 border-blue-50">
                          <h3 className="text-2xl font-black">{classItem.name}</h3>
                          <p className="text-gray-500">{classItem.subject}</p>
                          <div className="mt-6 flex gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-2xl"><div className="text-2xl font-black text-blue-600">{rate}%</div><div className="text-xs">Attendance</div></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledClasses.map(classItem => (
                      <div key={classItem.id} onClick={() => setSelectedClassId(classItem.id)} className="card hover:shadow-xl cursor-pointer">
                        <h3 className="font-black">{classItem.name}</h3>
                        <p className="text-sm text-gray-500">{classItem.subject}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="card bg-white p-6 rounded-2xl">
                 <h3 className="text-xl font-bold mb-6">Attendance Summary</h3>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-gray-50">
                         <th className="p-4">Subject</th>
                         <th className="p-4 text-center">Rate</th>
                       </tr>
                     </thead>
                     <tbody>
                       {enrolledClasses.map(c => {
                         const stats = getAttendanceStats(c.id);
                         const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                         return (
                           <tr key={c.id} className="border-b">
                             <td className="p-4 font-bold">{c.name}</td>
                             <td className="p-4 text-center font-black text-blue-600">{rate}%</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto card p-6">
                <h3 className="text-xl font-bold mb-6">Profile Settings</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="input-field" placeholder="Full Name" />
                  <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="input-field" placeholder="Email" />
                  <button type="submit" className="btn btn-primary w-full py-3 font-bold">Save Changes</button>
                </form>
                <div className="mt-10 pt-10 border-t">
                  <h4 className="font-bold mb-4">Biometrics</h4>
                  <button onClick={() => { setIsFaceMode('register'); setIsScanning(true); }} className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2"><div className="icon-scan"></div>Register Face</button>
                </div>
              </div>
            )}
            {error && <div className="fixed bottom-8 right-8 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-xl font-bold z-50">{error}</div>}
            {success && <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-xl font-bold z-50">{success}</div>}
          </main>
        </div>
        {isScanning && (
          isFaceMode ? (
            <FaceRecognition mode={isFaceMode} studentId={user.studentId} onSuccess={handleFaceScanSuccess} onCancel={() => setIsScanning(false)} />
          ) : (
            <QRScanner onScanSuccess={handleScanSuccess} onCancel={() => setIsScanning(false)} />
          )
        )}
      </div>
    );
  } catch (error) {
    console.error('StudentDashboard error:', error);
    return null;
  }
}