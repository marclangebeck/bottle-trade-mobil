import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Winehandel {
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

export default function Winehandel() {
  const [winehandel, setWinehandel] = useState<Winehandel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWinehandel, setSelectedWinehandel] = useState<Winehandel | null>(null);

  useEffect(() => {
    loadWinehandel();
  }, []);

  const loadWinehandel = async () => {
    try {
      setLoading(true);
      const winehandelQuery = query(collection(db, 'winehandel'), orderBy('createdAt', 'desc'));
      const winehandelSnapshot = await getDocs(winehandelQuery);
      
      // Für jedes Weinhandel-Unternehmen den Owner-Status prüfen
      const winehandelWithOwnerStatus = await Promise.all(
        winehandelSnapshot.docs.map(async (docSnapshot) => {
          const winehandelData = { id: docSnapshot.id, ...docSnapshot.data() } as Winehandel;
          
          try {
            const ownerDoc = await getDoc(doc(db, 'users', winehandelData.ownerId));
            const owner = ownerDoc.data();
            
            return {
              ...winehandelData,
              ownerExists: !!owner,
              ownerActive: owner?.status === 'active' || owner?.isActive === true,
              ownerEmail: owner?.email || 'Unbekannt',
              ownerUsername: owner?.username || 'Unbekannt',
            };
          } catch (error) {
            console.error(`Fehler beim Laden des Owners für Weinhandel ${winehandelData.id}:`, error);
            return {
              ...winehandelData,
              ownerExists: false,
              ownerActive: false,
              ownerEmail: 'Fehler beim Laden',
              ownerUsername: 'Fehler beim Laden',
            };
          }
        })
      );
      
      setWinehandel(winehandelWithOwnerStatus);
    } catch (error) {
      console.error('Fehler beim Laden der Weinhandel-Unternehmen:', error);
      alert('Fehler beim Laden der Weinhandel-Unternehmen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWinehandel = async (winehandelItem: Winehandel) => {
    if (!confirm(`Möchten Sie das Weinhandel-Unternehmen "${winehandelItem.name}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'winehandel', winehandelItem.id));
      alert('Weinhandel-Unternehmen wurde gelöscht.');
      loadWinehandel();
    } catch (error) {
      console.error('Fehler beim Löschen des Weinhandels:', error);
      alert('Fehler beim Löschen des Weinhandels');
    }
  };

  const handleToggleVerification = async (winehandelItem: Winehandel) => {
    try {
      await updateDoc(doc(db, 'winehandel', winehandelItem.id), {
        isVerified: !winehandelItem.isVerified,
      });
      loadWinehandel();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Verifizierung:', error);
      alert('Fehler beim Aktualisieren der Verifizierung');
    }
  };

  const handleCleanupOrphanedWinehandel = async () => {
    const orphanedWinehandel = winehandel.filter((w) => !w.ownerExists || !w.ownerActive);
    
    if (orphanedWinehandel.length === 0) {
      alert('Keine verwaisten Weinhandel-Unternehmen gefunden.');
      return;
    }

    if (!confirm(`Es wurden ${orphanedWinehandel.length} verwaiste Weinhandel-Unternehmen gefunden.\n\nMöchten Sie alle verwaisten Unternehmen löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      let deletedCount = 0;
      let errorCount = 0;

      for (const winehandelItem of orphanedWinehandel) {
        try {
          await deleteDoc(doc(db, 'winehandel', winehandelItem.id));
          deletedCount++;
        } catch (error) {
          console.error(`Fehler beim Löschen von Weinhandel ${winehandelItem.id}:`, error);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        alert(`${deletedCount} Weinhandel-Unternehmen wurden gelöscht.\n${errorCount} Unternehmen konnten nicht gelöscht werden.`);
      } else {
        alert(`${deletedCount} verwaiste Weinhandel-Unternehmen wurden gelöscht.`);
      }
      
      loadWinehandel();
    } catch (error) {
      console.error('Fehler beim Löschen verwaister Weinhandel-Unternehmen:', error);
      alert('Fehler beim Löschen verwaister Weinhandel-Unternehmen');
    }
  };

  const filteredWinehandel = winehandel.filter((winehandelItem) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      winehandelItem.name?.toLowerCase().includes(query) ||
      winehandelItem.ownerEmail?.toLowerCase().includes(query) ||
      winehandelItem.ownerUsername?.toLowerCase().includes(query) ||
      winehandelItem.region?.toLowerCase().includes(query) ||
      winehandelItem.address?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: winehandel.length,
    verified: winehandel.filter((w) => w.isVerified).length,
    unverified: winehandel.filter((w) => !w.isVerified).length,
    orphaned: winehandel.filter((w) => !w.ownerExists || !w.ownerActive).length,
  };

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Weinhandel-Unternehmen...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Weinhandel-Verwaltung</h1>
        <div className="text-white">
          Gesamt: {winehandel.length} | Angezeigt: {filteredWinehandel.length}
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
            onClick={handleCleanupOrphanedWinehandel}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            🗑️ {stats.orphaned} verwaiste Unternehmen löschen
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

      {/* Winehandel Table */}
      {filteredWinehandel.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gold-light p-12 text-center">
          <div className="text-6xl mb-4">🍷</div>
          <div className="text-xl text-gray-300">
            {searchQuery ? 'Keine Weinhandel-Unternehmen gefunden' : 'Keine Weinhandel-Unternehmen vorhanden'}
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
              {filteredWinehandel.map((winehandelItem) => (
                <tr
                  key={winehandelItem.id}
                  className={`hover:bg-gray-700/50 ${
                    !winehandelItem.ownerExists || !winehandelItem.ownerActive ? 'bg-red-900/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {winehandelItem.name || 'Unbenannt'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>{winehandelItem.ownerEmail || winehandelItem.ownerUsername || 'Unbekannt'}</div>
                    {(!winehandelItem.ownerExists || !winehandelItem.ownerActive) && (
                      <div className="text-xs text-red-400 mt-1">
                        {!winehandelItem.ownerExists ? '⚠️ Owner existiert nicht' : '⛔ Owner nicht aktiv'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {winehandelItem.isVerified ? (
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
                        onClick={() => setSelectedWinehandel(winehandelItem)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleToggleVerification(winehandelItem)}
                        className={`px-3 py-1 rounded text-sm ${
                          winehandelItem.isVerified
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {winehandelItem.isVerified ? '❌ Verifizierung entfernen' : '✅ Verifizieren'}
                      </button>
                      <button
                        onClick={() => handleDeleteWinehandel(winehandelItem)}
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

      {/* Winehandel Details Modal */}
      {selectedWinehandel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gold-light p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Weinhandel-Details</h2>
              <button
                onClick={() => setSelectedWinehandel(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Name</label>
                <div className="text-white">{selectedWinehandel.name || 'N/A'}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Owner</label>
                <div className="text-white">
                  {selectedWinehandel.ownerEmail || selectedWinehandel.ownerUsername || 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Verifiziert</label>
                <div className="text-white">{selectedWinehandel.isVerified ? 'Ja' : 'Nein'}</div>
              </div>
              {selectedWinehandel.region && (
                <div>
                  <label className="text-gray-400 text-sm">Region</label>
                  <div className="text-white">{selectedWinehandel.region}</div>
                </div>
              )}
              {selectedWinehandel.address && (
                <div>
                  <label className="text-gray-400 text-sm">Adresse</label>
                  <div className="text-white">{selectedWinehandel.address}</div>
                </div>
              )}
              {selectedWinehandel.description && (
                <div>
                  <label className="text-gray-400 text-sm">Beschreibung</label>
                  <div className="text-white">{selectedWinehandel.description}</div>
                </div>
              )}
              {selectedWinehandel.images && selectedWinehandel.images.length > 0 && (
                <div>
                  <label className="text-gray-400 text-sm">Bilder</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {selectedWinehandel.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Weinhandelbild ${idx + 1}`}
                        className="w-full h-48 object-contain bg-gray-700 rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedWinehandel(null)}
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



