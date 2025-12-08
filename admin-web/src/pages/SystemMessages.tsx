import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotificationsForSystemMessage } from '../utils/notifications';

interface SystemMessage {
  id: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  createdAt?: any;
}

export default function SystemMessages() {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [messageData, setMessageData] = useState({
    title: '',
    content: '',
    priority: 'normal',
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesQuery = query(collection(db, 'systemMessages'), orderBy('createdAt', 'desc'));
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SystemMessage[];
      setMessages(messagesData);
    } catch (error) {
      console.error('Fehler beim Laden der Systemnachrichten:', error);
      const messagesSnapshot = await getDocs(collection(db, 'systemMessages'));
      const messagesData = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SystemMessage[];
      setMessages(messagesData);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = async () => {
    if (!messageData.title.trim() || !messageData.content.trim()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      await addDoc(collection(db, 'systemMessages'), {
        title: messageData.title,
        content: messageData.content,
        priority: messageData.priority,
        status: 'draft',
        createdAt: serverTimestamp(),
      });
      alert('Systemnachricht wurde erfolgreich erstellt!');
      setMessageData({ title: '', content: '', priority: 'normal' });
      setIsCreating(false);
      loadMessages();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen der Systemnachricht');
    }
  };

  const handleSendMessage = async (messageId: string) => {
    if (!confirm('Möchten Sie diese Systemnachricht wirklich versenden?')) return;
    
    try {
      // Lade Systemnachricht, um targetGroup zu erhalten
      const messageDoc = await getDoc(doc(db, 'systemMessages', messageId));
      let targetGroup = 'all';
      
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        targetGroup = messageData.targetGroup || 'all';
      }

      // Erstelle Notifications für alle Ziel-User
      let notificationCount = 0;
      try {
        notificationCount = await createNotificationsForSystemMessage(messageId, targetGroup);
        console.log(`✅ ${notificationCount} Notifications für Systemnachricht erstellt`);
      } catch (notificationError) {
        console.error('⚠️ Fehler beim Erstellen der Notifications:', notificationError);
        alert('Systemnachricht konnte nicht versendet werden. Bitte versuchen Sie es erneut.');
        return;
      }

      if (notificationCount === 0) {
        alert('Warnung: Keine Notifications erstellt. Möglicherweise wurden keine Ziel-User gefunden.');
        return;
      }

      // Aktualisiere Status auf "sent"
      await updateDoc(doc(db, 'systemMessages', messageId), {
        status: 'sent',
        sentAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert(`Systemnachricht wurde erfolgreich an ${notificationCount} Empfänger gesendet!`);
      loadMessages();
    } catch (error) {
      console.error('Fehler beim Versenden:', error);
      alert('Fehler beim Versenden der Systemnachricht');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Möchten Sie diese Systemnachricht wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'systemMessages', messageId));
      loadMessages();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Systemnachricht');
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Systemnachrichten...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">System-Nachrichten</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-gold hover:bg-yellow-600 text-dark-bg rounded-lg font-medium"
        >
          {isCreating ? 'Abbrechen' : '+ Neue Nachricht'}
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-800 rounded-lg border border-gold-light p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Neue Systemnachricht erstellen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Titel *</label>
              <input
                type="text"
                value={messageData.title}
                onChange={(e) => setMessageData({ ...messageData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Inhalt *</label>
              <textarea
                value={messageData.content}
                onChange={(e) => setMessageData({ ...messageData, content: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                rows={10}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Priorität</label>
              <select
                value={messageData.priority}
                onChange={(e) => setMessageData({ ...messageData, priority: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="normal">Normal</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>
            <button
              onClick={handleCreateMessage}
              className="px-4 py-2 bg-gold hover:bg-yellow-600 text-dark-bg rounded-lg font-medium"
            >
              Systemnachricht erstellen
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-12 text-center text-gray-300">Keine Systemnachrichten vorhanden</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Priorität</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {messages.map((message) => (
                <tr key={message.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-white">{message.title}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        message.priority === 'urgent'
                          ? 'bg-red-900/50 text-red-200'
                          : message.priority === 'high'
                          ? 'bg-orange-900/50 text-orange-200'
                          : 'bg-gray-900/50 text-gray-200'
                      }`}
                    >
                      {message.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        message.status === 'sent'
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                      }`}
                    >
                      {message.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      {message.status !== 'sent' && (
                        <button
                          onClick={() => handleSendMessage(message.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          Senden
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
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
    </div>
  );
}
