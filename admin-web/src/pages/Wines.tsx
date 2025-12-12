import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Wine {
  id: string;
  name?: string;
  title?: string;
  weingut?: string;
  jahrgang?: string;
  owner?: string;
  ownerName?: string;
  description?: string;
  status: string;
  labelImages?: string[];
  labelImage?: string;
}

export default function Wines() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);

  useEffect(() => {
    loadWines();
  }, []);

  const loadWines = async () => {
    try {
      setLoading(true);
      const winesQuery = query(
        collection(db, 'wines'),
        where('status', '==', 'public')
      );
      const winesSnapshot = await getDocs(winesQuery);
      const winesData = winesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Wine[];
      setWines(winesData);
    } catch (error) {
      console.error('Fehler beim Laden der Weine:', error);
      alert('Fehler beim Laden der Weine');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWine = async (wine: Wine) => {
    if (!confirm(`Möchten Sie den Wein "${wine.name || wine.title}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'wines', wine.id));
      setWines((prev) => prev.filter((w) => w.id !== wine.id));
      alert('Wein wurde gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Weins');
    }
  };

  const handleDeleteAllWines = async () => {
    if (!confirm('Möchten Sie wirklich ALLE Weine aus der Weinbörse löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!')) {
      return;
    }

    try {
      const winesQuery = query(
        collection(db, 'wines'),
        where('status', '==', 'public')
      );
      const winesSnapshot = await getDocs(winesQuery);
      const batch = writeBatch(db);

      winesSnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      setWines([]);
      alert('Alle Weine wurden gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen aller Weine:', error);
      alert('Fehler beim Löschen der Weine');
    }
  };

  const filteredWines = wines.filter((wine) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (wine.name || '').toLowerCase().includes(searchLower) ||
      (wine.title || '').toLowerCase().includes(searchLower) ||
      (wine.weingut || '').toLowerCase().includes(searchLower) ||
      (wine.owner || '').toLowerCase().includes(searchLower) ||
      (wine.ownerName || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Weine...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Wein-Verwaltung</h1>
        <div className="text-white">
          Gesamt: {wines.length} | Angezeigt: {filteredWines.length}
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gold-light mb-6">
        <div className="text-gray-400 text-sm mb-2">Weine in der Weinbörse</div>
        <div className="text-3xl font-bold text-gold">{wines.length}</div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nach Name, Weingut oder Owner suchen..."
          className="w-full max-w-md px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold"
        />
      </div>

      {/* Delete All Button */}
      {wines.length > 0 && (
        <div className="mb-6">
          <button
            onClick={handleDeleteAllWines}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ Alle Weine löschen
          </button>
        </div>
      )}

      {/* Wines Table */}
      {filteredWines.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gold-light p-12 text-center">
          <div className="text-6xl mb-4">🍷</div>
          <div className="text-xl text-gray-300">
            {searchQuery ? 'Keine Weine gefunden' : 'Keine Weine in der Weinbörse'}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Weingut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Jahrgang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredWines.map((wine) => (
                <tr key={wine.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {wine.name || wine.title || 'Unbekannter Wein'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {wine.weingut || 'Unbekannt'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {wine.jahrgang || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {wine.owner || wine.ownerName || 'Unbekannt'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedWine(wine)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteWine(wine)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Wine Details Modal */}
      {selectedWine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gold-light p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Wein-Details</h2>
              <button
                onClick={() => setSelectedWine(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Name</label>
                <div className="text-white">{selectedWine.name || selectedWine.title || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Weingut</label>
                <div className="text-white">{selectedWine.weingut || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Jahrgang</label>
                <div className="text-white">{selectedWine.jahrgang || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Owner</label>
                <div className="text-white">{selectedWine.owner || selectedWine.ownerName || 'N/A'}</div>
              </div>
              {selectedWine.description && (
                <div>
                  <label className="text-gray-400 text-sm">Beschreibung</label>
                  <div className="text-white">{selectedWine.description}</div>
                </div>
              )}
              {(selectedWine.labelImages && selectedWine.labelImages.length > 0) || selectedWine.labelImage ? (
                <div>
                  <label className="text-gray-400 text-sm">Bilder</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {selectedWine.labelImages?.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Weinbild ${idx + 1}`}
                        className="w-full h-48 object-contain bg-gray-700 rounded"
                      />
                    )) || (selectedWine.labelImage && (
                      <img
                        src={selectedWine.labelImage}
                        alt="Weinbild"
                        className="w-full h-48 object-contain bg-gray-700 rounded"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedWine(null)}
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











