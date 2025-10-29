// Chat Service für Firebase Firestore Integration
// Wird später implementiert, wenn Tausch-System fertig ist

import { db } from '../config/firebase-web';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

class ChatService {
  // Chat-Kanal erstellen
  static async createChat(participants, type = 'direct', tradeRequestId = null) {
    try {
      const chatData = {
        participants: participants,
        type: type,
        tradeRequestId: tradeRequestId,
        status: 'active',
        createdAt: new Date(),
        lastMessage: '',
        lastMessageTime: new Date()
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      console.log('✅ Chat erstellt:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Chats:', error);
      throw error;
    }
  }

  // Nachricht senden
  static async sendMessage(chatId, senderId, text) {
    try {
      const messageData = {
        chatId: chatId,
        senderId: senderId,
        text: text,
        timestamp: new Date(),
        status: 'sent',
        reactions: {}
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Chat's lastMessage aktualisieren
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageTime: new Date()
      });

      console.log('✅ Nachricht gesendet:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Fehler beim Senden der Nachricht:', error);
      throw error;
    }
  }

  // Chat löschen (bei Tausch-Abschluss)
  static async deleteChat(chatId) {
    try {
      // Alle Nachrichten des Chats löschen
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Chat löschen
      await deleteDoc(doc(db, 'chats', chatId));
      
      console.log('✅ Chat und alle Nachrichten gelöscht:', chatId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Chats:', error);
      throw error;
    }
  }

  // Chats eines Users abrufen
  static async getUserChats(userId) {
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        where('status', '==', 'active'),
        orderBy('lastMessageTime', 'desc')
      );

      const snapshot = await getDocs(chatsQuery);
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('✅ Chats abgerufen:', chats.length);
      return chats;
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Chats:', error);
      throw error;
    }
  }

  // Nachrichten eines Chats abrufen
  static async getChatMessages(chatId) {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(messagesQuery);
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('✅ Nachrichten abgerufen:', messages.length);
      return messages;
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Nachrichten:', error);
      throw error;
    }
  }

  // Real-time Chat Listener
  static subscribeToChats(userId, callback) {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      where('status', '==', 'active'),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(chats);
    });
  }

  // Real-time Messages Listener
  static subscribeToMessages(chatId, callback) {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  }

  // Nachrichten-Status aktualisieren
  static async updateMessageStatus(messageId, status) {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        status: status
      });
      console.log('✅ Nachrichten-Status aktualisiert:', messageId, status);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren des Nachrichten-Status:', error);
      throw error;
    }
  }

  // Emoji-Reaction hinzufügen/entfernen
  static async toggleReaction(messageId, emoji, userId) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDocs(query(collection(db, 'messages'), where('__name__', '==', messageId)));
      
      if (!messageDoc.empty) {
        const messageData = messageDoc.docs[0].data();
        const reactions = messageData.reactions || {};
        
        if (reactions[emoji]) {
          if (reactions[emoji].includes(userId)) {
            // Reaction entfernen
            reactions[emoji] = reactions[emoji].filter(id => id !== userId);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            // Reaction hinzufügen
            reactions[emoji] = [...reactions[emoji], userId];
          }
        } else {
          // Neue Reaction
          reactions[emoji] = [userId];
        }

        await updateDoc(messageRef, { reactions });
        console.log('✅ Reaction aktualisiert:', messageId, emoji);
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Reaction:', error);
      throw error;
    }
  }
}

export default ChatService;
