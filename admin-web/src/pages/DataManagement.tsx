import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Chat {
  id: string;
  participants?: string[];
  lastMessage?: string;
  createdAt?: any;
  entryType?: string;
  tradeRequestId?: string;
  deleted?: boolean;
}

interface Hint {
  id: string;
  entryType: string;
  tradeRequestId?: string;
  requestId?: string;
  userId?: string;
  fromUserId?: string;
  toUserId?: string;
  createdAt?: any;
  deleted?: boolean;
}

interface Trade {
  id: string;
  fromUserId?: string;
  toUserId?: string;
  status?: string;
  createdAt?: any;
  deleted?: boolean;
}

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<'chats' | 'hints' | 'trades'>('chats');
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [hints, setHints] = useState<Hint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadChats(), loadHints(), loadTrades()]);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      const chatsQuery = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatsData = chatsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Chat))
        .filter((chat) => chat.entryType !== 'hint');
      setChats(chatsData);
    } catch (error) {
      console.error('Fehler beim Laden der Chats:', error);
      try {
        const chatsSnapshot = await getDocs(collection(db, 'chats'));
        const chatsData = chatsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Chat))
          .filter((chat) => chat.entryType !== 'hint');
        setChats(chatsData);
      } catch (fallbackError) {
        console.error('Fehler beim Laden der Chats (Fallback):', fallbackError);
        setChats([]);
      }
    }
  };

  const loadHints = async () => {
    try {
      const hintsQuery = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));
      const hintsSnapshot = await getDocs(hintsQuery);
      const hintsData = hintsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Hint))
        .filter((hint) => hint.entryType === 'hint');
      setHints(hintsData);
    } catch (error) {
      console.error('Fehler beim Laden der Hinweise:', error);
      setHints([]);
    }
  };

  const loadTrades = async () => {
    try {
      const tradesQuery = query(collection(db, 'tradeRequests'), orderBy('createdAt', 'desc'));
      const tradesSnapshot = await getDocs(tradesQuery);
      const tradesData = tradesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trade[];
      setTrades(tradesData);
    } catch (error) {
      console.error('Fehler beim Laden der Trade-Requests:', error);
      try {
        const tradesSnapshot = await getDocs(collection(db, 'tradeRequests'));
        const tradesData = tradesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Trade[];
        setTrades(tradesData);
      } catch (fallbackError) {
        console.error('Fehler beim Laden der Trade-Requests (Fallback):', fallbackError);
        setTrades([]);
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Möchten Sie diesen Chat wirklich PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\n\nAlle Nachrichten werden ebenfalls gelöscht.')) {
      return;
    }

    try {
      // Lösche alle zugehörigen Nachrichten aus Firestore (Subcollection)
      try {
        const messagesSubcollectionRef = collection(db, 'chats', chatId, 'messages');
        const messagesSnapshot = await getDocs(messagesSubcollectionRef);
        const messageBatch = writeBatch(db);
        
        messagesSnapshot.docs.forEach((messageDoc) => {
          messageBatch.delete(messageDoc.ref);
        });
        
        if (messagesSnapshot.docs.length > 0) {
          await messageBatch.commit();
        }
      } catch (subcollectionError) {
        console.error('Fehler beim Löschen der Messages-Subcollection:', subcollectionError);
      }

      // PHYSISCH löschen aus Firestore
      await deleteDoc(doc(db, 'chats', chatId));
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      alert('Chat wurde physisch aus Firestore gelöscht!');
      loadChats();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Chat konnte nicht gelöscht werden: ' + (error as Error).message);
    }
  };

  const handleDeleteHint = async (hintId: string) => {
    if (!confirm('Möchten Sie diesen Hinweis wirklich PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'chats', hintId));
      setHints((prev) => prev.filter((hint) => hint.id !== hintId));
      alert('Hinweis wurde physisch aus Firestore gelöscht!');
      loadHints();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Hinweis konnte nicht gelöscht werden: ' + (error as Error).message);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Möchten Sie diesen Trade-Request wirklich PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'tradeRequests', tradeId));
      setTrades((prev) => prev.filter((trade) => trade.id !== tradeId));
      alert('Trade-Request wurde physisch aus Firestore gelöscht!');
      loadTrades();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Trade-Request konnte nicht gelöscht werden: ' + (error as Error).message);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Möchten Sie wirklich ALLE Chats, Hinweise UND Trades PHYSISCH aus Firestore löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!')) {
      return;
    }

    try {
      let deletedChats = 0;
      let deletedHints = 0;
      let deletedTrades = 0;
      let deletedMessages = 0;

      // 1. Lösche alle Chats
      for (const chat of chats) {
        try {
          const messagesSubcollectionRef = collection(db, 'chats', chat.id, 'messages');
          const messagesSnapshot = await getDocs(messagesSubcollectionRef);
          const messageBatch = writeBatch(db);
          messagesSnapshot.docs.forEach((messageDoc) => {
            messageBatch.delete(messageDoc.ref);
            deletedMessages++;
          });
          if (messagesSnapshot.docs.length > 0) {
            await messageBatch.commit();
          }
          await deleteDoc(doc(db, 'chats', chat.id));
          deletedChats++;
        } catch (error) {
          console.error(`Fehler beim Löschen von Chat ${chat.id}:`, error);
        }
      }

      // 2. Lösche alle Hinweise
      for (const hint of hints) {
        try {
          await deleteDoc(doc(db, 'chats', hint.id));
          deletedHints++;
        } catch (error) {
          console.error(`Fehler beim Löschen von Hinweis ${hint.id}:`, error);
        }
      }

      // 3. Lösche alle Trade-Requests
      for (const trade of trades) {
        try {
          await deleteDoc(doc(db, 'tradeRequests', trade.id));
          deletedTrades++;
        } catch (error) {
          console.error(`Fehler beim Löschen von Trade ${trade.id}:`, error);
        }
      }

      setChats([]);
      setHints([]);
      setTrades([]);

      alert(
        `Alle Daten wurden gelöscht:\n\n• ${deletedChats} Chats\n• ${deletedHints} Hinweise\n• ${deletedTrades} Trade-Requests\n• ${deletedMessages} Nachrichten`
      );
    } catch (error) {
      console.error('Fehler beim Löschen aller Daten:', error);
      alert('Fehler beim Löschen: ' + (error as Error).message);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unbekannt';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('de-DE');
    } catch (error) {
      return 'Unbekannt';
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Daten-Verwaltung</h1>
        <button
          onClick={handleDeleteAll}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          🗑️ ALLE löschen
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-700">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'chats'
                ? 'text-gold border-b-2 border-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chats ({chats.length})
          </button>
          <button
            onClick={() => setActiveTab('hints')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'hints'
                ? 'text-gold border-b-2 border-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Hinweise ({hints.length})
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'trades'
                ? 'text-gold border-b-2 border-gold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trades ({trades.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'chats' && (
        <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
          {chats.length === 0 ? (
            <div className="p-12 text-center text-gray-300">Keine Chats gefunden</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Chat ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Teilnehmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Erstellt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {chats.map((chat) => (
                  <tr key={chat.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-white">#{chat.id.substring(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {chat.participants?.length || 0} Teilnehmer
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{formatDate(chat.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteChat(chat.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        🗑️ Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'hints' && (
        <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
          {hints.length === 0 ? (
            <div className="p-12 text-center text-gray-300">Keine Hinweise gefunden</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Hinweis ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trade Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Erstellt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {hints.map((hint) => (
                  <tr key={hint.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-white">#{hint.id.substring(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {hint.tradeRequestId || hint.requestId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{formatDate(hint.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteHint(hint.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        🗑️ Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
          {trades.length === 0 ? (
            <div className="p-12 text-center text-gray-300">Keine Trade-Requests gefunden</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trade ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Von</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Zu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Erstellt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-white">#{trade.id.substring(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{trade.fromUserId?.substring(0, 8) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{trade.toUserId?.substring(0, 8) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          trade.status === 'accepted'
                            ? 'bg-green-900/50 text-green-200'
                            : trade.status === 'rejected'
                            ? 'bg-red-900/50 text-red-200'
                            : 'bg-yellow-900/50 text-yellow-200'
                        }`}
                      >
                        {trade.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{formatDate(trade.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        🗑️ Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}











