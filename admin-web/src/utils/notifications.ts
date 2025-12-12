import {
  collection,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Ruft alle User ab
 */
export const getAllUsers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'));
    const querySnapshot = await getDocs(usersQuery);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      uid: doc.data().uid || doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('❌ Error getting all users:', error);
    throw error;
  }
};

/**
 * Ruft alle aktiven User ab (User, die in den letzten 30 Tagen aktiv waren)
 */
export const getActiveUsers = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersQuery = query(collection(db, 'users'), where('lastActive', '>=', thirtyDaysAgo));
    const querySnapshot = await getDocs(usersQuery);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      uid: doc.data().uid || doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('❌ Error getting active users:', error);
    // Fallback: Lade alle User und filtere clientseitig
    const allUsers = await getAllUsers();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return allUsers.filter((user: any) => {
      if (!user.lastActive) return false;
      const lastActive = (user.lastActive as any).toDate
        ? (user.lastActive as any).toDate()
        : new Date(user.lastActive);
      return lastActive >= thirtyDaysAgo;
    });
  }
};

/**
 * Ruft alle Newsletter-Abonnenten ab (User mit newsletter_optin: true)
 */
export const getNewsletterSubscribers = async () => {
  try {
    const usersQuery = query(collection(db, 'users'), where('newsletter_optin', '==', true));
    const querySnapshot = await getDocs(usersQuery);

    const subscribers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      uid: doc.data().uid || doc.id,
      ...doc.data(),
    }));

    console.log(`📧 Newsletter-Abonnenten gefunden: ${subscribers.length}`);

    if (subscribers.length === 0) {
      console.warn('⚠️ Keine Newsletter-Abonnenten gefunden, verwende alle User als Fallback');
      const allUsers = await getAllUsers();
      return allUsers;
    }

    return subscribers;
  } catch (error) {
    console.error('❌ Error getting newsletter subscribers:', error);
    // Fallback: Lade alle User und filtere clientseitig
    try {
      const allUsers = await getAllUsers();
      const filtered = allUsers.filter(
        (user: any) =>
          user.newsletter_optin === true ||
          user.newsletterOptin === true ||
          user.newsletter === true
      );

      if (filtered.length === 0) {
        console.warn('⚠️ Keine Newsletter-Abonnenten gefunden, verwende alle User');
        return allUsers;
      }

      return filtered;
    } catch (fallbackError) {
      console.error('❌ Error in fallback for newsletter subscribers:', fallbackError);
      return [];
    }
  }
};

/**
 * Ruft User basierend auf Zielgruppe ab
 */
export const getTargetUsers = async (targetGroup: string) => {
  try {
    switch (targetGroup) {
      case 'all':
        return await getAllUsers();
      case 'active':
        return await getActiveUsers();
      case 'newsletter_subscribers':
        return await getNewsletterSubscribers();
      default:
        console.warn(`⚠️ Unbekannte Zielgruppe: ${targetGroup}, verwende "all"`);
        return await getAllUsers();
    }
  } catch (error) {
    console.error('❌ Error getting target users:', error);
    throw error;
  }
};

/**
 * Erstellt Notifications für alle Ziel-User einer Umfrage
 */
export const createNotificationsForSurvey = async (surveyId: string, targetGroup: string) => {
  try {
    // Lade Umfrage
    const surveyDoc = await getDoc(doc(db, 'surveys', surveyId));
    if (!surveyDoc.exists()) {
      throw new Error('Umfrage nicht gefunden');
    }
    const survey = { id: surveyDoc.id, ...surveyDoc.data() } as any;

    const targetUsers = await getTargetUsers(targetGroup);
    console.log(`📊 Erstelle Notifications für ${targetUsers.length} User (Survey: ${surveyId})`);

    // Batch-Processing für große Zielgruppen (500 pro Batch)
    const batchSize = 500;
    let notificationCount = 0;

    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = targetUsers.slice(i, i + batchSize);

      for (const user of batchUsers) {
        const userId = (user as any).uid || (user as any).id;
        if (!userId) continue;

        try {
          const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
          batch.set(notificationRef, {
            type: 'survey',
            title: survey.title,
            message: survey.question || 'Neue Umfrage verfügbar',
            surveyId: surveyId,
            isRead: false,
            isArchived: false,
            isCompleted: false,
            createdAt: serverTimestamp(),
          });
          notificationCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Erstellen der Notification für User ${userId}:`, error);
        }
      }

      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} abgeschlossen (${notificationCount} Notifications)`);
    }

    console.log(`✅ ${notificationCount} Notifications für Survey ${surveyId} erstellt`);
    return notificationCount;
  } catch (error) {
    console.error('❌ Error creating notifications for survey:', error);
    throw error;
  }
};

/**
 * Erstellt Notifications für alle Ziel-User eines Newsletters
 */
export const createNotificationsForNewsletter = async (
  newsletterId: string,
  targetGroup: string
) => {
  try {
    // Lade Newsletter
    const newsletterDoc = await getDoc(doc(db, 'newsletters', newsletterId));
    if (!newsletterDoc.exists()) {
      throw new Error('Newsletter nicht gefunden');
    }
    const newsletter = { id: newsletterDoc.id, ...newsletterDoc.data() } as any;

    console.log(`📧 Newsletter-Daten:`, {
      id: newsletterId,
      title: newsletter.title,
      targetGroup,
    });

    const targetUsers = await getTargetUsers(targetGroup);
    console.log(`📧 Erstelle Notifications für ${targetUsers.length} User (Newsletter: ${newsletterId})`);

    if (targetUsers.length === 0) {
      console.warn('⚠️ Keine Ziel-User gefunden für Newsletter:', newsletterId);
      return 0;
    }

    // Batch-Processing für große Zielgruppen (500 pro Batch)
    const batchSize = 500;
    let notificationCount = 0;
    let errorCount = 0;

    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = targetUsers.slice(i, i + batchSize);
      let batchNotificationCount = 0;

      for (const user of batchUsers) {
        const userId = (user as any).uid || (user as any).id;
        if (!userId) {
          console.warn('⚠️ User ohne uid/id gefunden:', user);
          continue;
        }

        try {
          const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
          const content = (newsletter.content as string) || '';
          batch.set(notificationRef, {
            type: 'newsletter',
            title: newsletter.title,
            message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            newsletterId: newsletterId,
            isRead: false,
            isArchived: false,
            isCompleted: false,
            createdAt: serverTimestamp(),
          });
          notificationCount++;
          batchNotificationCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Erstellen der Notification für User ${userId}:`, error);
          errorCount++;
        }
      }

      if (batchNotificationCount > 0) {
        try {
          await batch.commit();
          console.log(
            `✅ Batch ${Math.floor(i / batchSize) + 1} abgeschlossen (${batchNotificationCount} Notifications)`
          );
        } catch (batchError) {
          console.error(`❌ Fehler beim Commit des Batches ${Math.floor(i / batchSize) + 1}:`, batchError);
          errorCount += batchNotificationCount;
        }
      }
    }

    console.log(
      `✅ ${notificationCount} Notifications für Newsletter ${newsletterId} erstellt (${errorCount} Fehler)`
    );
    return notificationCount;
  } catch (error) {
    console.error('❌ Error creating notifications for newsletter:', error);
    throw error;
  }
};

/**
 * Erstellt Notifications für alle Ziel-User einer System-Ankündigung
 */
export const createNotificationsForSystemMessage = async (
  messageId: string,
  targetGroup: string
) => {
  try {
    // Lade Systemnachricht
    const messageDoc = await getDoc(doc(db, 'systemMessages', messageId));
    if (!messageDoc.exists()) {
      throw new Error('System-Ankündigung nicht gefunden');
    }
    const systemMessage = { id: messageDoc.id, ...messageDoc.data() } as any;

    const targetUsers = await getTargetUsers(targetGroup);
    console.log(
      `📢 Erstelle Notifications für ${targetUsers.length} User (SystemMessage: ${messageId})`
    );

    // Batch-Processing für große Zielgruppen (500 pro Batch)
    const batchSize = 500;
    let notificationCount = 0;

    for (let i = 0; i < targetUsers.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUsers = targetUsers.slice(i, i + batchSize);

      for (const user of batchUsers) {
        const userId = (user as any).uid || (user as any).id;
        if (!userId) continue;

        try {
          const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
          const content = (systemMessage.content as string) || '';
          batch.set(notificationRef, {
            type: 'system',
            title: systemMessage.title,
            message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            systemMessageId: messageId,
            priority: systemMessage.priority || 'normal',
            isRead: false,
            isArchived: false,
            isCompleted: false,
            createdAt: serverTimestamp(),
          });
          notificationCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Erstellen der Notification für User ${userId}:`, error);
        }
      }

      await batch.commit();
      console.log(
        `✅ Batch ${Math.floor(i / batchSize) + 1} abgeschlossen (${notificationCount} Notifications)`
      );
    }

    console.log(`✅ ${notificationCount} Notifications für SystemMessage ${messageId} erstellt`);
    return notificationCount;
  } catch (error) {
    console.error('❌ Error creating notifications for system message:', error);
    throw error;
  }
};











