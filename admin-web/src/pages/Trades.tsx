import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Trade {
  id: string;
  fromUserId?: string;
  toUserId?: string;
  status?: string;
  createdAt?: any;
}

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const tradesQuery = query(collection(db, 'tradeRequests'), orderBy('createdAt', 'desc'));
      const tradesSnapshot = await getDocs(tradesQuery);
      const tradesData = tradesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trade[];
      setTrades(tradesData);
    } catch (error) {
      console.error('Fehler beim Laden der Trade-Requests:', error);
      const tradesSnapshot = await getDocs(collection(db, 'tradeRequests'));
      const tradesData = tradesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Trade[];
      setTrades(tradesData);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Möchten Sie diesen Trade-Request wirklich löschen?')) return;
    try {
      await deleteDoc(doc(db, 'tradeRequests', tradeId));
      setTrades((prev) => prev.filter((trade) => trade.id !== tradeId));
      alert('Trade-Request wurde gelöscht!');
      loadTrades();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Trade-Requests');
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
        <div className="text-xl">Lade Trade-Requests...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Trade-Verwaltung</h1>
        <div className="text-white">Gesamt: {trades.length}</div>
      </div>

      {/* Trades List */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        {trades.length === 0 ? (
          <div className="p-12 text-center text-gray-300">Keine Trade-Requests vorhanden</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Trade ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Von</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Zu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Datum</th>
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedTrade(trade)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
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

      {/* Trade Details Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gold-light p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Trade-Details</h2>
              <button
                onClick={() => setSelectedTrade(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Trade ID</label>
                <div className="text-white">{selectedTrade.id}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Von User</label>
                <div className="text-white">{selectedTrade.fromUserId || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Zu User</label>
                <div className="text-white">{selectedTrade.toUserId || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Status</label>
                <div className="text-white">{selectedTrade.status || 'pending'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Datum</label>
                <div className="text-white">{formatDate(selectedTrade.createdAt)}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTrade(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

