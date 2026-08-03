function GradingSystem({ classData }) {
  try {
    const [activeTerm, setActiveTerm] = React.useState('midterm');
    const [activeTab, setActiveTab] = React.useState('quizzes');
    const [students, setStudents] = React.useState([]);
    const [filteredStudents, setFilteredStudents] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [grades, setGrades] = React.useState({});
    const [assessments, setAssessments] = React.useState({
      midterm: {
        quizzes: [],
        activities: [],
        exams: []
      },
      finals: {
        quizzes: [],
        activities: [],
        exams: []
      }
    });

    React.useEffect(() => {
      loadStudents();
      loadGrades();
      loadAssessments();
    }, [classData.id]);

    const loadStudents = async () => {
      try {
        const classStudents = await getStudents(classData.id);
        const studentList = Array.isArray(classStudents) ? classStudents : [];
        setStudents(studentList);
        setFilteredStudents(studentList);
      } catch (error) {
        console.error("Error loading students in grading:", error);
      }
    };

    React.useEffect(() => {
      let result;
      if (searchQuery.trim() === '') {
        result = students;
      } else {
        const query = searchQuery.toLowerCase();
        result = students.filter(student => 
          student.name.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query)
        );
      }
      setFilteredStudents(result);
    }, [searchQuery, students]);

    const loadGrades = () => {
      const savedGrades = localStorage.getItem(`grades_${classData.id}`);
      setGrades(savedGrades ? JSON.parse(savedGrades) : {});
    };

    const loadAssessments = () => {
      const saved = localStorage.getItem(`assessments_${classData.id}`);
      const defaultStructure = {
        midterm: { quizzes: [], activities: [], exams: [] },
        finals: { quizzes: [], activities: [], exams: [] }
      };
      
      if (saved) {
        const parsedData = JSON.parse(saved);
        if (!parsedData.midterm && !parsedData.finals) {
          setAssessments({
            midterm: {
              quizzes: parsedData.quizzes || [],
              activities: parsedData.activities || [],
              exams: parsedData.exams || []
            },
            finals: { quizzes: [], activities: [], exams: [] }
          });
        } else {
          setAssessments(parsedData);
        }
      } else {
        setAssessments(defaultStructure);
      }
    };

    const saveGrades = (newGrades) => {
      localStorage.setItem(`grades_${classData.id}`, JSON.stringify(newGrades));
      setGrades(newGrades);
    };

    const saveAssessments = (newAssessments) => {
      localStorage.setItem(`assessments_${classData.id}`, JSON.stringify(newAssessments));
      setAssessments(newAssessments);
    };

    const addAssessment = (type) => {
      const name = prompt(`Enter ${type.slice(0, -1)} name:`);
      if (name) {
        const maxScore = prompt('Maximum score:', '100') || '100';
        const newAssessment = {
          id: Date.now().toString(),
          name: name.trim(),
          maxScore: maxScore,
          date: new Date().toISOString().split('T')[0]
        };
        const updated = { ...assessments };
        updated[activeTerm][type].push(newAssessment);
        saveAssessments(updated);
      }
    };

    const updateGrade = (studentId, assessmentType, assessmentId, score) => {
      const key = `${studentId}_${activeTerm}_${assessmentType}_${assessmentId}`;
      const newGrades = { ...grades, [key]: parseFloat(score) || 0 };
      saveGrades(newGrades);
    };

    const getGrade = (studentId, assessmentType, assessmentId) => {
      const key = `${studentId}_${activeTerm}_${assessmentType}_${assessmentId}`;
      return grades[key] || '';
    };

    const getEffectiveTotal = (studentId, type) => {
      const typeAssessments = assessments[activeTerm][type];
      let total = 0;
      let maxTotal = 0;
      
      typeAssessments.forEach(assessment => {
        const score = getGrade(studentId, type, assessment.id);
        maxTotal += parseFloat(assessment.maxScore);
        if (score !== '') {
          total += parseFloat(score);
        }
      });
      
      const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
      return { total, maxTotal, percentage };
    };

    const calculateWeightedPeriodGrade = (studentId, term) => {
      const savedTerm = activeTerm;
      // In this system, calculations always use the current activeTab term context but getEffectiveTotal handles it
      const quizzesTotal = getEffectiveTotal(studentId, 'quizzes');
      const activitiesTotal = getEffectiveTotal(studentId, 'activities');
      const examsTotal = getEffectiveTotal(studentId, 'exams');
      
      const weights = { quizzes: 0.20, activities: 0.60, exams: 0.20 };
      let weightedScore = 0;
      let totalWeight = 0;
      
      ['quizzes', 'activities', 'exams'].forEach(type => {
        const total = type === 'quizzes' ? quizzesTotal : 
                     type === 'activities' ? activitiesTotal : examsTotal;
        
        if (total.maxTotal > 0) {
          const percentage = (total.total / total.maxTotal);
          weightedScore += percentage * weights[type];
          totalWeight += weights[type];
        }
      });
      
      const grade = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
      return {
          grade,
          quizzesPct: quizzesTotal.maxTotal > 0 ? Math.round((quizzesTotal.total / quizzesTotal.maxTotal) * 100) : 0,
          activitiesPct: activitiesTotal.maxTotal > 0 ? Math.round((activitiesTotal.total / activitiesTotal.maxTotal) * 100) : 0,
          examsPct: examsTotal.maxTotal > 0 ? Math.round((examsTotal.total / examsTotal.maxTotal) * 100) : 0
      };
    };

    const getMidtermGrade = (studentId) => {
        const key = `${studentId}_midterm_final_grade_cache`;
        const cached = localStorage.getItem(key);
        return cached ? parseInt(cached) : 0;
    };

    const calculateFinalGrade = (studentId) => {
        const midtermGrade = getMidtermGrade(studentId);
        const finalTermGrade = calculateWeightedPeriodGrade(studentId, 'finals').grade;
        // User logic: 33.3% Midterm + 66.7% Final Term
        const finalGrade = Math.round((midtermGrade * 0.333) + (finalTermGrade * 0.667));
        return { midtermGrade, finalTermGrade, finalGrade };
    };

    const editAssessmentName = (type, assessment) => {
      const newName = prompt('Edit assessment name:', assessment.name);
      if (newName && newName.trim()) {
        const updated = { ...assessments };
        const index = updated[activeTerm][type].findIndex(a => a.id === assessment.id);
        if (index >= 0) {
          updated[activeTerm][type][index].name = newName.trim();
          saveAssessments(updated);
        }
      }
    };

    const deleteAssessment = (type, assessmentId) => {
      if (confirm('Delete this assessment and all its grades?')) {
        const updated = { ...assessments };
        updated[activeTerm][type] = updated[activeTerm][type].filter(a => a.id !== assessmentId);
        saveAssessments(updated);
      }
    };

    return (
      <div className="space-y-6" data-name="grading-system" data-file="components/GradingSystem.js">
        <div className="space-y-3">
          <div className="flex space-x-1 bg-blue-50 p-1 rounded-lg border-2 border-blue-200">
            {['midterm', 'finals'].map((term) => (
              <button
                key={term}
                onClick={() => { setActiveTerm(term); setActiveTab('summary'); }}
                className={`flex-1 py-3 px-6 rounded-md text-base font-semibold transition-all ${
                  activeTerm === term ? 'bg-blue-600 text-white shadow-md' : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                {term === 'midterm' ? 'Midterm Period' : 'Finals Period'}
              </button>
            ))}
          </div>

          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            {['summary', 'quizzes', 'activities', 'exams'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {activeTerm === 'midterm' ? 'Midterm' : 'Finals'} - {activeTab.toUpperCase()}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="input-field w-64 pl-10"
                />
                <div className="icon-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></div>
              </div>
              {activeTab !== 'summary' && (
                <button onClick={() => addAssessment(activeTab)} className="btn btn-primary flex items-center gap-2">
                  <div className="icon-plus"></div> Add
                </button>
              )}
            </div>
          </div>

          {activeTab === 'summary' ? (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-bold text-indigo-900 mb-2">Term Weighted Split:</h4>
                  <p>• Quizzes (20%) | Activities (60%) | Exams (20%)</p>
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 mb-2">Final Grading Formula:</h4>
                  <p>• (Midterm × 33.3%) + (Final Term × 66.7%)</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-3 px-4 text-left">Student Name</th>
                      <th className="py-3 px-4 text-center">Quizzes (20%)</th>
                      <th className="py-3 px-4 text-center">Activities (60%)</th>
                      <th className="py-3 px-4 text-center">Exams (20%)</th>
                      <th className="py-3 px-4 text-center bg-blue-50">Term Grade</th>
                      {activeTerm === 'finals' && (
                        <>
                          <th className="py-3 px-4 text-center bg-orange-50">Midterm (33.3%)</th>
                          <th className="py-3 px-4 text-center bg-green-50">FINAL GRADE</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const stats = calculateWeightedPeriodGrade(student.studentId, activeTerm);
                      if (activeTerm === 'midterm') {
                        localStorage.setItem(`${student.studentId}_midterm_final_grade_cache`, stats.grade.toString());
                      }
                      const finalCalc = activeTerm === 'finals' ? calculateFinalGrade(student.studentId) : null;
                      return (
                        <tr key={student.id} className="border-b hover:bg-slate-50">
                          <td className="py-4 px-4 font-bold">{student.name}</td>
                          <td className="py-4 px-4 text-center">{stats.quizzesPct}%</td>
                          <td className="py-4 px-4 text-center">{stats.activitiesPct}%</td>
                          <td className="py-4 px-4 text-center">{stats.examsPct}%</td>
                          <td className="py-4 px-4 text-center font-black text-blue-700 bg-blue-50/50">{stats.grade}%</td>
                          {activeTerm === 'finals' && finalCalc && (
                            <>
                              <td className="py-4 px-4 text-center font-bold text-orange-700 bg-orange-50/50">{finalCalc.midtermGrade}%</td>
                              <td className="py-4 px-4 text-center font-black text-green-700 bg-green-50/50">{finalCalc.finalGrade}%</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="py-3 px-4 text-left">Student</th>
                    {assessments[activeTerm][activeTab].map(a => (
                      <th key={a.id} className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <button onClick={() => editAssessmentName(activeTab, a)} className="hover:underline">{a.name}</button>
                          <span className="text-[10px] text-slate-400">/{a.maxScore}</span>
                          <button onClick={() => deleteAssessment(activeTab, a.id)} className="text-red-400"><div className="icon-trash-2 text-xs"></div></button>
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center font-bold">Category Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => {
                    const total = getEffectiveTotal(student.studentId, activeTab);
                    return (
                      <tr key={student.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">{student.name}</td>
                        {assessments[activeTerm][activeTab].map(a => (
                          <td key={a.id} className="py-3 px-4 text-center">
                            <input
                              type="number"
                              className="w-16 p-1 border rounded text-center"
                              value={getGrade(student.studentId, activeTab, a.id)}
                              onChange={(e) => updateGrade(student.studentId, activeTab, a.id, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="py-3 px-4 text-center font-bold">
                            {total.percentage}% ({total.total}/{total.maxTotal})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error('Grading Error:', err);
    return null;
  }
}