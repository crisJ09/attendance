// Storage utility functions for classes and students using Trickle Database

// Global Event Bus for internal synchronization
const storageListeners = new Set();
let isDatabaseConnected = true;

function notifyStorageChange(key) {
  storageListeners.forEach(listener => listener(key));
}

function subscribeToStorage(callback) {
  storageListeners.add(callback);
  return () => storageListeners.delete(callback);
}

/**
 * Generic retry wrapper for database operations to handle network flakes
 */
async function dbOperation(operation, fallback = []) {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await operation();
      isDatabaseConnected = true;
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Database operation attempt ${i + 1} failed:`, error.message);
      
      // If it's a fetch error, we might be offline or server is busy
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        isDatabaseConnected = false;
      }
      
      if (i < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
      }
    }
  }

  console.error('Database operation failed after retries:', lastError);
  return fallback;
}

async function getClasses() {
  return await dbOperation(async () => {
    const { items } = await trickleListObjects('class', 500, true);
    return (items || []).map(item => ({ 
      ...item.objectData, 
      id: item.objectId,
      schedule: item.objectData.schedule ? JSON.parse(item.objectData.schedule) : null 
    }));
  }, []);
}

async function saveClass(classData) {
  try {
    const dataToSave = { 
      ...classData, 
      schedule: classData.schedule ? JSON.stringify(classData.schedule) : null 
    };
    delete dataToSave.id; // objectId is separate

    if (classData.id && !classData.id.startsWith('temp_')) {
      await trickleUpdateObject('class', classData.id, dataToSave);
    } else {
      await trickleCreateObject('class', dataToSave);
    }
    notifyStorageChange('attendanceClasses');
  } catch (error) {
    console.error('Error saving class:', error);
  }
}

async function getClassesByTeacher(teacherEmail) {
  try {
    const classes = await getClasses();
    return classes.filter(c => {
      if (!c.teacherEmail) {
        return teacherEmail === 'teacher@school.edu';
      }
      return c.teacherEmail === teacherEmail;
    });
  } catch (error) {
    console.error('Error getting classes by teacher:', error);
    return [];
  }
}

async function deleteClass(classId) {
  try {
    await trickleDeleteObject('class', classId);
    notifyStorageChange('attendanceClasses');
  } catch (error) {
    console.error('Error deleting class:', error);
  }
}

async function archiveClass(classId, isArchived = true) {
  try {
    await trickleUpdateObject('class', classId, { 
      isArchived, 
      archivedAt: isArchived ? new Date().toISOString() : null 
    });
    notifyStorageChange('attendanceClasses');
  } catch (error) {
    console.error('Error archiving class:', error);
  }
}

async function getStudents(classId) {
  if (!classId) return [];
  return await dbOperation(async () => {
    const { items } = await trickleListObjects(`student:${classId}`, 1000, true);
    return (items || []).map(item => ({ ...item.objectData, id: item.objectId }));
  }, []);
}

async function saveStudent(classId, studentData) {
  try {
    const dataToSave = { ...studentData, classId };
    delete dataToSave.id;

    if (studentData.id && !studentData.id.startsWith('temp_')) {
      await trickleUpdateObject(`student:${classId}`, studentData.id, dataToSave);
    } else {
      await trickleCreateObject(`student:${classId}`, dataToSave);
    }
    notifyStorageChange(`students_${classId}`);
  } catch (error) {
    console.error('Error saving student:', error);
  }
}

async function deleteStudent(classId, studentId) {
  try {
    await trickleDeleteObject(`student:${classId}`, studentId);
    notifyStorageChange(`students_${classId}`);
  } catch (error) {
    console.error('Error deleting student:', error);
  }
}

async function getTeachers() {
  try {
    const { items } = await trickleListObjects('teacher', 500, true);
    return items.map(item => ({ ...item.objectData, id: item.objectId }));
  } catch (error) {
    console.error('Error getting teachers:', error);
    return [];
  }
}

async function saveTeacher(teacherData) {
  try {
    const dataToSave = { ...teacherData };
    delete dataToSave.id;

    if (teacherData.id && !teacherData.id.startsWith('temp_')) {
      await trickleUpdateObject('teacher', teacherData.id, dataToSave);
    } else {
      await trickleCreateObject('teacher', dataToSave);
    }
    notifyStorageChange('attendanceTeachers');
  } catch (error) {
    console.error('Error saving teacher:', error);
  }
}

async function deleteTeacher(teacherId) {
  try {
    await trickleDeleteObject('teacher', teacherId);
    notifyStorageChange('attendanceTeachers');
  } catch (error) {
    console.error('Error deleting teacher:', error);
  }
}

// Session settings are small and global, can remain in localStorage or moved to a global settings table
function getSessions() {
  try {
    const sessions = localStorage.getItem('attendanceSessions');
    const defaultSessions = [
      { id: 'AM', name: 'Session 1', description: 'Morning Session', startTime: '08:00', endTime: '12:00' },
      { id: 'PM', name: 'Session 2', description: 'Afternoon Session', startTime: '13:00', endTime: '17:00' }
    ];
    return sessions ? JSON.parse(sessions) : defaultSessions;
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
}

function saveSession(sessionData) {
  try {
    const sessions = getSessions();
    const existingIndex = sessions.findIndex(s => s.id === sessionData.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionData;
    } else {
      sessions.push(sessionData);
    }
    localStorage.setItem('attendanceSessions', JSON.stringify(sessions));
    notifyStorageChange('attendanceSessions');
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Attendance marks deletion
async function deleteSingleAttendanceRecord(classId, studentId, date, session) {
  try {
    const { items } = await trickleListObjects(`attendance:${classId}`, 1000, true);
    const target = items.find(item => 
      item.objectData.studentId === studentId && 
      item.objectData.date === date && 
      (item.objectData.session || 'AM') === session
    );
    if (target) {
      await trickleDeleteObject(`attendance:${classId}`, target.objectId);
      notifyStorageChange(`attendance_${classId}`);
    }
  } catch (error) {
    console.error('Error deleting single record:', error);
  }
}

// Empty implementations for legacy functions no longer needed in cloud-first approach but kept to prevent breaking imports
function migrateLegacyClasses() {}
function preserveAllData() { return true; }
function migrateGradeData() {}