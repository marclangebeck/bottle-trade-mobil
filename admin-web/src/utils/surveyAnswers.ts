import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllUsers } from './notifications';

/**
 * Ruft alle Antworten zu einer Umfrage ab
 */
export const getSurveyAnswers = async (surveyId: string) => {
  try {
    // Hole alle User
    const allUsers = await getAllUsers();
    const allAnswers: any[] = [];

    // Durchsuche alle User nach Antworten
    for (const user of allUsers) {
      const userId = (user as any).uid || (user as any).id;
      if (!userId) continue;

      try {
        const answersQuery = query(
          collection(db, 'surveyAnswers', userId, 'answers'),
          where('surveyId', '==', surveyId)
        );
        const querySnapshot = await getDocs(answersQuery);

        querySnapshot.docs.forEach((doc) => {
          allAnswers.push({
            id: doc.id,
            userId,
            ...doc.data(),
          });
        });
      } catch (error) {
        // Ignoriere Fehler bei einzelnen Usern
        console.warn(`⚠️ Fehler beim Laden von Antworten für User ${userId}:`, error);
      }
    }

    return allAnswers;
  } catch (error) {
    console.error('❌ Error getting survey answers:', error);
    throw error;
  }
};

/**
 * Berechnet die Ergebnisse einer Umfrage
 */
export const calculateSurveyResults = (survey: any, answers: any[]) => {
  if (!survey || !survey.options || !Array.isArray(survey.options)) {
    return null;
  }

  const optionCounts: { [key: number]: number } = {};
  const totalAnswers = answers.filter((answer) => answer.surveyId === survey.id).length;

  // Initialisiere alle Optionen mit 0
  survey.options.forEach((_: any, index: number) => {
    optionCounts[index] = 0;
  });

  // Zähle die Antworten
  answers
    .filter((answer) => answer.surveyId === survey.id)
    .forEach((answer) => {
      if (optionCounts[answer.selectedOption] !== undefined) {
        optionCounts[answer.selectedOption]++;
      }
    });

  // Berechne Prozente
  const optionResults = Object.keys(optionCounts).map((optionIndex) => {
    const index = parseInt(optionIndex);
    const count = optionCounts[index];
    const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
    return {
      option: survey.options[index],
      count,
      percentage,
      index,
    };
  });

  return {
    totalAnswers,
    optionResults,
  };
};








