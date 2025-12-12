import { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, orderBy, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Inserat {
  id: string;
  type: 'suche' | 'biete';
  title: string;
  description: string;
  images?: string[];
  userId: string;
  contactInfo?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function Blackboard() {
  const [inserate, setInserate] = useState<Inserat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInserat, setSelectedInserat] = useState<Inserat | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInserate();
    
    // Echtzeit-Updates abonnieren
    const inserateRef = collection(db, 'inserate');
    const q = query(inserateRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inserateData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Inserat[];
      setInserate(inserateData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadInserate = async () => {
    try {
      setLoading(true);
      const inserateQuery = query(collection(db, 'inserate'), orderBy('createdAt', 'desc'));
      const inserateSnapshot = await getDocs(inserateQuery);
      const inserateData = inserateSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Inserat[];
      setInserate(inserateData);
    } catch (error) {
      console.error('Fehler beim Laden der Inserate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (inseratId: string) => {
    const confirmed = window.confirm('Willst du dieses Inserat wirklich löschen?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'inserate', inseratId));
      alert('Inserat wurde gelöscht.');
      setSelectedInserat((prev) => (prev?.id === inseratId ? null : prev));
    } catch (error) {
      console.error('Fehler beim Löschen des Inserats:', error);
      alert('Fehler beim Löschen des Inserats');
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

  const filteredInserate = inserate.filter((inserat) => {
    const matchesType = !filterType || inserat.type === filterType;
    const matchesSearch = !searchQuery.trim() || 
      inserat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inserat.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Inserate...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Schwarzes Brett</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Inserate durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">Alle Typen</option>
            <option value="suche">Ich suche...</option>
            <option value="biete">Ich biete...</option>
          </select>
        </div>
      </div>

      {/* Inserate List */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        {filteredInserate.length === 0 ? (
          <div className="p-12 text-center text-gray-300">Keine Inserate vorhanden</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Titel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Beschreibung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredInserate.map((inserat) => (
                <tr key={inserat.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        inserat.type === 'suche'
                          ? 'bg-blue-900/50 text-blue-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                      }`}
                    >
                      {inserat.type === 'suche' ? 'Suche' : 'Biete'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{inserat.title || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-md truncate">
                    {inserat.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{inserat.userId?.substring(0, 8) || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{formatDate(inserat.createdAt)}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedInserat(inserat)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDelete(inserat.id)}
                        className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inserat Details Modal */}
      {selectedInserat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gold-light p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Inserat-Details</h2>
              <button
                onClick={() => setSelectedInserat(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Typ</label>
                <div className="text-white">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      selectedInserat.type === 'suche'
                        ? 'bg-blue-900/50 text-blue-200'
                        : 'bg-yellow-900/50 text-yellow-200'
                    }`}
                  >
                    {selectedInserat.type === 'suche' ? 'Ich suche...' : 'Ich biete...'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Titel</label>
                <div className="text-white">{selectedInserat.title || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Beschreibung</label>
                <div className="text-white whitespace-pre-wrap">{selectedInserat.description || 'N/A'}</div>
              </div>
              {selectedInserat.contactInfo && (
                <div>
                  <label className="text-gray-400 text-sm">Kontaktinformationen</label>
                  <div className="text-white">{selectedInserat.contactInfo}</div>
                </div>
              )}
              {selectedInserat.images && selectedInserat.images.length > 0 && (
                <div>
                  <label className="text-gray-400 text-sm">Bilder ({selectedInserat.images.length})</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {selectedInserat.images.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Bild ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-gray-400 text-sm">User ID</label>
                <div className="text-white">{selectedInserat.userId || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Erstellt am</label>
                <div className="text-white">{formatDate(selectedInserat.createdAt)}</div>
              </div>
              {selectedInserat.updatedAt && (
                <div>
                  <label className="text-gray-400 text-sm">Aktualisiert am</label>
                  <div className="text-white">{formatDate(selectedInserat.updatedAt)}</div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => selectedInserat && handleDelete(selectedInserat.id)}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded mr-3"
              >
                Löschen
              </button>
              <button
                onClick={() => setSelectedInserat(null)}
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
