import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Winery {
  id: string;
  name: string;
  ownerId: string;
  isVerified: boolean;
  region?: string;
  address?: string;
  description?: string;
  images?: string[];
  ownerExists?: boolean;
  ownerActive?: boolean;
  ownerEmail?: string;
  ownerUsername?: string;
}

export default function Wineries() {
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWinery, setSelectedWinery] = useState<Winery | null>(null);

  useEffect(() => {
    loadWineries();
  }, []);

  const loadWineries = async () => {
    try {
      setLoading(true);
      const wineriesQuery = query(collection(db, 'wineries'), orderBy('createdAt', 'desc'));
      const wineriesSnapshot = await getDocs(wineriesQuery);
      
      // Für jedes Weingut den Owner-Status prüfen
      const wineriesWithOwnerStatus = await Promise.all(
        wineriesSnapshot.docs.map(async (docSnapshot) => {
          const wineryData = { id: docSnapshot.id, ...docSnapshot.data() } as Winery;
          
          try {
            const ownerDoc = await getDoc(doc(db, 'users', wineryData.ownerId));
            const owner = ownerDoc.data();
            
            return {
              ...wineryData,
              ownerExists: !!owner,
              ownerActive: owner?.status === 'active' || owner?.isActive === true,
              ownerEmail: owner?.email || 'Unbekannt',
              ownerUsername: owner?.username || 'Unbekannt',
            };
          } catch (error) {
            console.error(`Fehler beim Laden des Owners für Weingut ${wineryData.id}:`, error);
            return {
              ...wineryData,
              ownerExists: false,
              ownerActive: false,
              ownerEmail: 'Fehler beim Laden',
              ownerUsername: 'Fehler beim Laden',
            };
          }
        })
      );
      
      setWineries(wineriesWithOwnerStatus);
    } catch (error) {
      console.error('Fehler beim Laden der Weingüter:', error);
      alert('Fehler beim Laden der Weingüter');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWinery = async (winery: Winery) => {
    if (!confirm(`Möchten Sie das Weingut "${winery.name}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'wineries', winery.id));
      alert('Weingut wurde gelöscht.');
      loadWineries();
    } catch (error) {
      console.error('Fehler beim Löschen des Weinguts:', error);
      alert('Fehler beim Löschen des Weinguts');
    }
  };

  const handleToggleVerification = async (winery: Winery) => {
    try {
      await updateDoc(doc(db, 'wineries', winery.id), {
        isVerified: !winery.isVerified,
      });
      loadWineries();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Verifizierung:', error);
      alert('Fehler beim Aktualisieren der Verifizierung');
    }
  };

  const handleCleanupOrphanedWineries = async () => {
    const orphanedWineries = wineries.filter((w) => !w.ownerExists || !w.ownerActive);
    
    if (orphanedWineries.length === 0) {
      alert('Keine verwaisten Weingüter gefunden.');
      return;
    }

    if (!confirm(`Es wurden ${orphanedWineries.length} verwaiste Weingüter gefunden.\n\nMöchten Sie alle verwaisten Weingüter löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      let deletedCount = 0;
      let errorCount = 0;

      for (const winery of orphanedWineries) {
        try {
          await deleteDoc(doc(db, 'wineries', winery.id));
          deletedCount++;
        } catch (error) {
          console.error(`Fehler beim Löschen von Weingut ${winery.id}:`, error);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        alert(`${deletedCount} Weingüter wurden gelöscht.\n${errorCount} Weingüter konnten nicht gelöscht werden.`);
      } else {
        alert(`${deletedCount} verwaiste Weingüter wurden gelöscht.`);
      }
      
      loadWineries();
    } catch (error) {
      console.error('Fehler beim Löschen verwaister Weingüter:', error);
      alert('Fehler beim Löschen verwaister Weingüter');
    }
  };

  const filteredWineries = wineries.filter((winery) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      winery.name?.toLowerCase().includes(query) ||
      winery.ownerEmail?.toLowerCase().includes(query) ||
      winery.ownerUsername?.toLowerCase().includes(query) ||
      winery.region?.toLowerCase().includes(query) ||
      winery.address?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: wineries.length,
    verified: wineries.filter((w) => w.isVerified).length,
    unverified: wineries.filter((w) => !w.isVerified).length,
    orphaned: wineries.filter((w) => !w.ownerExists || !w.ownerActive).length,
  };

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Weingüter...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Weingüter-Verwaltung</h1>
        <div className="text-white">
          Gesamt: {wineries.length} | Angezeigt: {filteredWineries.length}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
          <div className="text-gray-400 text-sm mb-2">Gesamt</div>
          <div className="text-3xl font-bold text-gold">{stats.total}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
          <div className="text-gray-400 text-sm mb-2">Verifiziert</div>
          <div className="text-3xl font-bold text-green-400">{stats.verified}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
          <div className="text-gray-400 text-sm mb-2">Nicht verifiziert</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.unverified}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
          <div className="text-gray-400 text-sm mb-2">Verwaist</div>
          <div className="text-3xl font-bold text-red-400">{stats.orphaned}</div>
        </div>
      </div>

      {/* Cleanup Button */}
      {stats.orphaned > 0 && (
        <div className="mb-6">
          <button
            onClick={handleCleanupOrphanedWineries}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ {stats.orphaned} verwaiste Weingüter löschen
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nach Name, Owner, Region suchen..."
          className="w-full max-w-md px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold"
        />
      </div>

      {/* Wineries Table */}
      {filteredWineries.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gold-light p-12 text-center">
          <div className="text-6xl mb-4">🏰</div>
          <div className="text-xl text-gray-300">
            {searchQuery ? 'Keine Weingüter gefunden' : 'Keine Weingüter vorhanden'}
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
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredWineries.map((winery) => (
                <tr
                  key={winery.id}
                  className={`hover:bg-gray-700/50 ${
                    !winery.ownerExists || !winery.ownerActive ? 'bg-red-900/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {winery.name || 'Unbenannt'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>{winery.ownerEmail || winery.ownerUsername || 'Unbekannt'}</div>
                    {(!winery.ownerExists || !winery.ownerActive) && (
                      <div className="text-xs text-red-400 mt-1">
                        {!winery.ownerExists ? '⚠️ Owner existiert nicht' : '⛔ Owner nicht aktiv'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {winery.isVerified ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-200">
                          ✅ Verifiziert
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-200">
                          ⏳ Nicht verifiziert
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedWinery(winery)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleToggleVerification(winery)}
                        className={`px-3 py-1 rounded text-sm ${
                          winery.isVerified
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {winery.isVerified ? '❌ Verifizierung entfernen' : '✅ Verifizieren'}
                      </button>
                      <button
                        onClick={() => handleDeleteWinery(winery)}
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
        </div>
      )}

      {/* Winery Details Modal */}
      {selectedWinery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gold-light p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Weingut-Details</h2>
              <button
                onClick={() => setSelectedWinery(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Name</label>
                <div className="text-white">{selectedWinery.name || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Owner</label>
                <div className="text-white">
                  {selectedWinery.ownerEmail || selectedWinery.ownerUsername || 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Verifiziert</label>
                <div className="text-white">{selectedWinery.isVerified ? 'Ja' : 'Nein'}</div>
              </div>
              {selectedWinery.region && (
                <div>
                  <label className="text-gray-400 text-sm">Region</label>
                  <div className="text-white">{selectedWinery.region}</div>
                </div>
              )}
              {selectedWinery.address && (
                <div>
                  <label className="text-gray-400 text-sm">Adresse</label>
                  <div className="text-white">{selectedWinery.address}</div>
                </div>
              )}
              {selectedWinery.description && (
                <div>
                  <label className="text-gray-400 text-sm">Beschreibung</label>
                  <div className="text-white">{selectedWinery.description}</div>
                </div>
              )}
              {selectedWinery.images && selectedWinery.images.length > 0 && (
                <div>
                  <label className="text-gray-400 text-sm">Bilder</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {selectedWinery.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Weingutbild ${idx + 1}`}
                        className="w-full h-48 object-contain bg-gray-700 rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedWinery(null)}
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

