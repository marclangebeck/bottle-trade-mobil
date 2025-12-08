import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotificationsForSurvey } from '../utils/notifications';
import { getSurveyAnswers, calculateSurveyResults } from '../utils/surveyAnswers';

interface Survey {
  id: string;
  title: string;
  question: string;
  options: string[];
  status: string;
  targetGroup: string;
  createdAt?: any;
}

interface SurveyResults {
  totalAnswers: number;
  optionResults: Array<{
    option: string;
    count: number;
    percentage: number;
    index: number;
  }>;
}

export default function Surveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyResults, setSurveyResults] = useState<SurveyResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [surveyData, setSurveyData] = useState({
    title: '',
    question: '',
    options: ['', ''],
    targetGroup: 'all',
  });

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const surveysQuery = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'));
      const surveysSnapshot = await getDocs(surveysQuery);
      const surveysData = surveysSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Survey[];
      setSurveys(surveysData);
    } catch (error) {
      console.error('Fehler beim Laden der Umfragen:', error);
      const surveysSnapshot = await getDocs(collection(db, 'surveys'));
      const surveysData = surveysSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Survey[];
      setSurveys(surveysData.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async () => {
    if (isSubmitting) {
      console.log('⚠️ Umfrage wird bereits erstellt, überspringe erneuten Aufruf');
      return;
    }

    if (!surveyData.title || !surveyData.question) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const validOptions = surveyData.options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Bitte geben Sie mindestens 2 Antwortoptionen ein.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔄 Erstelle Umfrage...');
      
      // Erstelle Umfrage in Firestore
      const surveyRef = await addDoc(collection(db, 'surveys'), {
        title: surveyData.title,
        question: surveyData.question,
        options: validOptions,
        targetGroup: surveyData.targetGroup,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      const surveyId = surveyRef.id;
      console.log('✅ Umfrage erstellt:', surveyId);

      // Erstelle Notifications für alle Ziel-User
      try {
        const notificationCount = await createNotificationsForSurvey(
          surveyId,
          surveyData.targetGroup || 'all'
        );
        console.log(`✅ ${notificationCount} Notifications für Umfrage erstellt`);
        alert(`Umfrage wurde erfolgreich erstellt und an ${notificationCount} Benutzer gesendet!`);
      } catch (notificationError) {
        console.error('⚠️ Fehler beim Erstellen der Notifications:', notificationError);
        alert('Umfrage wurde erstellt, aber Benachrichtigungen konnten nicht versendet werden.');
      }

      setSurveyData({ title: '', question: '', options: ['', ''], targetGroup: 'all' });
      setIsCreating(false); // Formular schließen
      setIsSubmitting(false);
      loadSurveys();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen der Umfrage: ' + (error as Error).message);
      setIsSubmitting(false);
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm('Möchten Sie diese Umfrage wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'surveys', surveyId));
      loadSurveys();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Umfrage');
    }
  };

  const handleUpdateStatus = async (surveyId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      loadSurveys();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const addOption = () => {
    if (surveyData.options.length < 6) {
      setSurveyData({ ...surveyData, options: [...surveyData.options, ''] });
    }
  };

  const removeOption = (index: number) => {
    if (surveyData.options.length > 2) {
      setSurveyData({
        ...surveyData,
        options: surveyData.options.filter((_, i) => i !== index),
      });
    }
  };

  const handleViewResults = async (survey: Survey) => {
    try {
      setIsLoadingResults(true);
      setSelectedSurvey(survey);
      setResultsModalVisible(true);

      // Lade Antworten
      const answers = await getSurveyAnswers(survey.id);
      console.log(`📊 ${answers.length} Antworten für Umfrage ${survey.id} geladen`);

      // Berechne Ergebnisse
      const results = calculateSurveyResults(survey, answers);
      setSurveyResults(results);
    } catch (error) {
      console.error('Fehler beim Laden der Ergebnisse:', error);
      alert('Fehler beim Laden der Umfrage-Ergebnisse');
    } finally {
      setIsLoadingResults(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Umfragen...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Umfragen-Verwaltung</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-gold hover:bg-yellow-600 text-dark-bg rounded-lg font-medium"
        >
          {isCreating ? 'Abbrechen' : '+ Neue Umfrage'}
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-800 rounded-lg border border-gold-light p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Neue Umfrage erstellen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Titel *</label>
              <input
                type="text"
                value={surveyData.title}
                onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Frage *</label>
              <textarea
                value={surveyData.question}
                onChange={(e) => setSurveyData({ ...surveyData, question: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Antwortoptionen *</label>
              {surveyData.options.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...surveyData.options];
                      newOptions[index] = e.target.value;
                      setSurveyData({ ...surveyData, options: newOptions });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder={`Option ${index + 1}`}
                  />
                  {surveyData.options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {surveyData.options.length < 6 && (
                <button
                  onClick={addOption}
                  className="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  + Option hinzufügen
                </button>
              )}
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Zielgruppe</label>
              <select
                value={surveyData.targetGroup}
                onChange={(e) => setSurveyData({ ...surveyData, targetGroup: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">Alle User</option>
                <option value="active">Nur aktive User</option>
              </select>
            </div>
            <button
              onClick={handleCreateSurvey}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium ${
                isSubmitting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gold hover:bg-yellow-600 text-dark-bg'
              }`}
            >
              {isSubmitting ? 'Wird erstellt...' : 'Umfrage erstellen'}
            </button>
          </div>
        </div>
      )}

      {/* Surveys List */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        {surveys.length === 0 ? (
          <div className="p-12 text-center text-gray-300">Keine Umfragen vorhanden</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Frage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {surveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-white">{survey.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{survey.question}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        survey.status === 'active'
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-gray-900/50 text-gray-200'
                      }`}
                    >
                      {survey.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewResults(survey)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        📊 Ergebnisse
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(survey.id, survey.status === 'active' ? 'closed' : 'active')}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        {survey.status === 'active' ? 'Beenden' : 'Aktivieren'}
                      </button>
                      <button
                        onClick={() => handleDeleteSurvey(survey.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Results Modal */}
      {resultsModalVisible && selectedSurvey && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Umfrage-Ergebnisse</h2>
              <button
                onClick={() => {
                  setResultsModalVisible(false);
                  setSelectedSurvey(null);
                  setSurveyResults(null);
                }}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {isLoadingResults ? (
                <div className="text-center text-white py-12">
                  <div className="text-xl">Lade Ergebnisse...</div>
                </div>
              ) : (
                <>
                  {/* Survey Info */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-2">{selectedSurvey.title}</h3>
                    <p className="text-gray-300 mb-4">{selectedSurvey.question}</p>
                    <div className="text-sm text-gray-400">
                      Status: {selectedSurvey.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                    </div>
                  </div>

                  {/* Results */}
                  {surveyResults ? (
                    <div>
                      <div className="mb-4">
                        <div className="text-lg font-bold text-white mb-2">
                          Gesamt: {surveyResults.totalAnswers} Antworten
                        </div>
                      </div>

                      <div className="space-y-4">
                        {surveyResults.optionResults.map((result, index) => (
                          <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">{result.option}</span>
                              <span className="text-gold font-bold">
                                {result.count} Stimmen ({result.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-3">
                              <div
                                className="bg-gold h-3 rounded-full transition-all duration-300"
                                style={{ width: `${result.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {surveyResults.totalAnswers === 0 && (
                        <div className="text-center text-gray-400 py-8">
                          Noch keine Antworten erhalten
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      Keine Ergebnisse verfügbar
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
