import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotificationsForNewsletter } from '../utils/notifications';

interface Newsletter {
  id: string;
  title: string;
  content: string;
  status: string;
  targetGroup: string;
  createdAt?: any;
}

export default function Newsletter() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newsletterData, setNewsletterData] = useState({
    title: '',
    content: '',
    targetGroup: 'newsletter_subscribers',
  });

  useEffect(() => {
    loadNewsletters();
  }, []);

  const loadNewsletters = async () => {
    try {
      setLoading(true);
      const newslettersQuery = query(collection(db, 'newsletters'), orderBy('createdAt', 'desc'));
      const newslettersSnapshot = await getDocs(newslettersQuery);
      const newslettersData = newslettersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Newsletter[];
      setNewsletters(newslettersData);
    } catch (error) {
      console.error('Fehler beim Laden der Newsletter:', error);
      const newslettersSnapshot = await getDocs(collection(db, 'newsletters'));
      const newslettersData = newslettersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Newsletter[];
      setNewsletters(newslettersData);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewsletter = async () => {
    if (!newsletterData.title.trim() || !newsletterData.content.trim()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      await addDoc(collection(db, 'newsletters'), {
        title: newsletterData.title,
        content: newsletterData.content,
        targetGroup: newsletterData.targetGroup,
        status: 'draft',
        createdAt: serverTimestamp(),
      });
      alert('Newsletter wurde erfolgreich erstellt!');
      setNewsletterData({ title: '', content: '', targetGroup: 'newsletter_subscribers' });
      setIsCreating(false);
      loadNewsletters();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen des Newsletters');
    }
  };

  const handleSendNewsletter = async (newsletterId: string) => {
    if (!confirm('Möchten Sie diesen Newsletter wirklich versenden?')) return;
    
    try {
      // Lade Newsletter, um targetGroup zu erhalten
      const newsletterDoc = await getDoc(doc(db, 'newsletters', newsletterId));
      let targetGroup = 'newsletter_subscribers';
      
      if (newsletterDoc.exists()) {
        const newsletterData = newsletterDoc.data();
        targetGroup = newsletterData.targetGroup || 'newsletter_subscribers';
      }

      // Erstelle Notifications für alle Ziel-User
      let notificationCount = 0;
      try {
        notificationCount = await createNotificationsForNewsletter(newsletterId, targetGroup);
        console.log(`✅ ${notificationCount} Notifications für Newsletter erstellt`);
      } catch (notificationError) {
        console.error('⚠️ Fehler beim Erstellen der Notifications:', notificationError);
        alert('Newsletter konnte nicht versendet werden. Bitte versuchen Sie es erneut.');
        return;
      }

      if (notificationCount === 0) {
        alert('Warnung: Keine Notifications erstellt. Möglicherweise wurden keine Ziel-User gefunden.');
        return;
      }

      // Aktualisiere Status auf "sent"
      await updateDoc(doc(db, 'newsletters', newsletterId), {
        status: 'sent',
        sentAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert(`Newsletter wurde erfolgreich an ${notificationCount} Empfänger gesendet!`);
      loadNewsletters();
    } catch (error) {
      console.error('Fehler beim Versenden:', error);
      alert('Fehler beim Versenden des Newsletters');
    }
  };

  const handleDeleteNewsletter = async (newsletterId: string) => {
    if (!confirm('Möchten Sie diesen Newsletter wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'newsletters', newsletterId));
      loadNewsletters();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Newsletters');
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Newsletter...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Newsletter-Verwaltung</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-gold hover:bg-yellow-600 text-dark-bg rounded-lg font-medium"
        >
          {isCreating ? 'Abbrechen' : '+ Neuer Newsletter'}
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-gray-800 rounded-lg border border-gold-light p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Neuen Newsletter erstellen</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Titel *</label>
              <input
                type="text"
                value={newsletterData.title}
                onChange={(e) => setNewsletterData({ ...newsletterData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Inhalt *</label>
              <textarea
                value={newsletterData.content}
                onChange={(e) => setNewsletterData({ ...newsletterData, content: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                rows={10}
              />
            </div>
            <button
              onClick={handleCreateNewsletter}
              className="px-4 py-2 bg-gold hover:bg-yellow-600 text-dark-bg rounded-lg font-medium"
            >
              Newsletter erstellen
            </button>
          </div>
        </div>
      )}

      {/* Newsletters List */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        {newsletters.length === 0 ? (
          <div className="p-12 text-center text-gray-300">Keine Newsletter vorhanden</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {newsletters.map((newsletter) => (
                <tr key={newsletter.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-white">{newsletter.title}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        newsletter.status === 'sent'
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                      }`}
                    >
                      {newsletter.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      {newsletter.status !== 'sent' && (
                        <button
                          onClick={() => handleSendNewsletter(newsletter.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          Senden
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNewsletter(newsletter.id)}
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
