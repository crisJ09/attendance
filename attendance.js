// Attendance utility functions for managing attendance records via Trickle Database

async function getAttendanceRecords(classId) {
  if (!classId) return [];
  // Uses the dbOperation from storage.js if available, otherwise handles internally
  const operation = async () => {
    const { items } = await trickleListObjects(`attendance:${classId}`, 1000, true);
    return (items || []).map(item => ({ ...item.objectData, id: item.objectId }));
  };

  if (window.dbOperation) {
    return await window.dbOperation(operation, []);
  }

  // Fallback if dbOperation isn't global yet
  try {
    const { items } = await trickleListObjects(`attendance:${classId}`, 1000, true);
    return (items || []).map(item => ({ ...item.objectData, id: item.objectId }));
  } catch (err) {
    console.error('Manual attendance fetch failed:', err);
    return [];
  }
}

async function saveAttendanceRecord(classId, recordData) {
  try {
    const dataToSave = { ...recordData, classId };
    delete dataToSave.id;
    
    // We usually create new records for attendance or update if it exists for the same student/date/session
    const existingRecords = await getAttendanceRecords(classId);
    const existing = existingRecords.find(r => 
      r.studentId === recordData.studentId && 
      r.date === recordData.date && 
      (r.session || 'AM') === recordData.session
    );

    if (existing) {
      await trickleUpdateObject(`attendance:${classId}`, existing.id, dataToSave);
    } else {
      await trickleCreateObject(`attendance:${classId}`, dataToSave);
    }
  } catch (error) {
    console.error('Error saving attendance record:', error);
  }
}

async function updateAttendanceRecord(classId, recordData) {
  try {
    const dataToSave = { ...recordData };
    const id = recordData.id;
    delete dataToSave.id;
    await trickleUpdateObject(`attendance:${classId}`, id, dataToSave);
  } catch (error) {
    console.error('Error updating attendance record:', error);
  }
}

async function deleteAttendanceRecord(classId, recordId) {
  try {
    await trickleDeleteObject(`attendance:${classId}`, recordId);
  } catch (error) {
    console.error('Error deleting attendance record:', error);
  }
}

async function getAttendanceStats(classId, studentId) {
  try {
    const records = await getAttendanceRecords(classId);
    const studentRecords = records.filter(r => r.studentId === studentId);
    
    const total = studentRecords.length;
    const present = studentRecords.filter(r => r.status === 'present').length;
    const late = studentRecords.filter(r => r.status === 'late').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;
    
    return { total, present, late, absent };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    return { total: 0, present: 0, late: 0, absent: 0 };
  }
}