import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  writeBatch,
  getDocs as getDocsQuery,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface User {
  id: string;
  uid?: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  isAdmin: boolean;
  isBlocked: boolean;
  status: string;
  emailConfirmed?: boolean | string;
  isActive?: boolean;
  subscriptionType?: 'basic' | 'pro';
  isWinery?: boolean;
  isWineryVerified?: boolean;
  createdAt?: any;
}

interface UserDetailsData {
  user: User;
  statistics: {
    wines: {
      total: number;
      public: number;
      private: number;
      traded: number;
    };
    chats: {
      total: number;
      hints: number;
    };
    trades: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
      completed: number;
    };
    wishes: {
      total: number;
      withMatches: number;
    };
    winery: {
      name: string;
      verified: boolean;
      hasProfile: boolean;
    } | null;
  };
  details: {
    wines: any[];
    chats: any[];
    trades: any[];
    wishes: any[];
  };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDetailsModalVisible, setUserDetailsModalVisible] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState<UserDetailsData | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);

  // Hilfsfunktion um E-Mail-Bestätigungsstatus zu prüfen
  const isEmailConfirmed = (user: User): boolean => {
    return (
      user.emailConfirmed === true ||
      user.emailConfirmed === 'true' ||
      user.status === 'confirmed' ||
      user.status === 'active'
    );
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Fehler beim Laden der User:', error);
      alert('Fehler beim Laden der User');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmailConfirmed = async (user: User) => {
    const emailConfirmed = isEmailConfirmed(user);
    const action = emailConfirmed ? 'E-Mail-Bestätigung entfernen' : 'E-Mail als bestätigt markieren';

    if (!confirm(`Möchten Sie für den User "${user.username || user.email}" wirklich ${action}?`)) {
      return;
    }

    try {
      const userId = user.uid || user.id;
      const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const querySnapshot = await getDocsQuery(userQuery);

      if (querySnapshot.empty) {
        // Fallback: Verwende user.id direkt
        await updateDoc(doc(db, 'users', user.id), {
          emailConfirmed: !emailConfirmed,
          status: !emailConfirmed ? 'confirmed' : 'pending',
        });
      } else {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          emailConfirmed: !emailConfirmed,
          status: !emailConfirmed ? 'confirmed' : 'pending',
        });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, emailConfirmed: !emailConfirmed, status: !emailConfirmed ? 'confirmed' : 'pending' }
            : u
        )
      );

      if (userDetailsData && userDetailsData.user.id === user.id) {
        setUserDetailsData((prev) => ({
          ...prev!,
          user: { ...prev!.user, emailConfirmed: !emailConfirmed, status: !emailConfirmed ? 'confirmed' : 'pending' },
        }));
      }

      alert(`E-Mail-Verifizierung wurde ${!emailConfirmed ? 'bestätigt' : 'entfernt'}!`);
    } catch (error) {
      console.error('Fehler beim Setzen der E-Mail-Verifizierung:', error);
      alert('E-Mail-Verifizierung konnte nicht geändert werden.');
    }
  };

  const handleToggleBlock = async (user: User) => {
    const isBlocked = user.isBlocked || false;
    const action = isBlocked ? 'entsperren' : 'sperren';

    if (!confirm(`Möchten Sie den User "${user.username || user.email}" wirklich ${action}?`)) {
      return;
    }

    try {
      const userId = user.uid || user.id;
      const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const querySnapshot = await getDocsQuery(userQuery);

      if (querySnapshot.empty) {
        // Fallback: Verwende user.id direkt
      await updateDoc(doc(db, 'users', user.id), {
        isBlocked: !isBlocked,
        blockedAt: !isBlocked ? new Date() : null,
        blockedBy: !isBlocked ? 'admin' : null,
      });
      } else {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          isBlocked: !isBlocked,
          blockedAt: !isBlocked ? new Date() : null,
          blockedBy: !isBlocked ? 'admin' : null,
        });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, isBlocked: !isBlocked, blockedAt: !isBlocked ? new Date() : null, blockedBy: !isBlocked ? 'admin' : null }
            : u
        )
      );

      alert(`User wurde ${action === 'sperren' ? 'gesperrt' : 'entsperrt'}!`);
    } catch (error) {
      console.error('Fehler beim Sperren/Entsperren:', error);
      alert(`User konnte nicht ${action} werden.`);
    }
  };

  const handleActivateUser = async (user: User) => {
    const isActive = user.isActive || user.status === 'active' || false;
    const action = isActive ? 'deaktivieren' : 'aktivieren';

    const emailConfirmed = isEmailConfirmed(user);
    const status = user.status || 'pending';

    if (!isActive && !emailConfirmed && status !== 'confirmed') {
      alert(
        `Der User "${user.username || user.email}" hat seine E-Mail-Adresse noch nicht bestätigt. Bitte warten Sie auf die E-Mail-Bestätigung, bevor Sie den User aktivieren.`
      );
      return;
    }

    if (!confirm(`Möchten Sie den User "${user.username || user.email}" wirklich ${action}?`)) {
      return;
    }

    try {
      const userId = user.uid || user.id;
      const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const querySnapshot = await getDocsQuery(userQuery);

      if (querySnapshot.empty) {
        // Fallback: Verwende user.id direkt
        await updateDoc(doc(db, 'users', user.id), {
          isActive: !isActive,
          status: !isActive ? 'active' : 'confirmed',
        });
      } else {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          isActive: !isActive,
          status: !isActive ? 'active' : 'confirmed',
        });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !isActive, status: !isActive ? 'active' : 'confirmed' } : u
        )
      );

      alert(`User wurde ${!isActive ? 'aktiviert' : 'deaktiviert'}!`);
    } catch (error) {
      console.error('Fehler beim Aktivieren/Deaktivieren:', error);
      alert(`User konnte nicht ${action} werden.`);
    }
  };

  const handleToggleSubscription = async (user: User) => {
    const currentType = user.subscriptionType || 'basic';
    const newType = currentType === 'pro' ? 'basic' : 'pro';
    const action = newType === 'pro' ? 'auf Pro-Version upgraden' : 'auf Basic-Version zurücksetzen';

    if (!confirm(`Möchten Sie den User "${user.username || user.email}" wirklich ${action}?`)) {
      return;
    }

    try {
      const userId = user.uid || user.id;
      const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const querySnapshot = await getDocsQuery(userQuery);

      if (querySnapshot.empty) {
        await updateDoc(doc(db, 'users', user.id), {
          subscriptionType: newType,
        });
      } else {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          subscriptionType: newType,
        });
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, subscriptionType: newType } : u))
      );

      if (userDetailsData && userDetailsData.user.id === user.id) {
        setUserDetailsData((prev) => ({
          ...prev!,
          user: { ...prev!.user, subscriptionType: newType },
        }));
      }

      alert(`User wurde ${newType === 'pro' ? 'auf Pro-Version' : 'auf Basic-Version'} umgestellt!`);
    } catch (error) {
      console.error('Fehler beim Umschalten der Version:', error);
      alert('Version konnte nicht umgestellt werden.');
    }
  };

  const handleVerifyWinery = async (user: User) => {
    const isVerified = user.isWineryVerified || false;
    const action = isVerified ? 'Verifizierung entfernen' : 'als Weingut verifizieren';

    if (!confirm(`Möchten Sie den User "${user.username || user.email}" wirklich ${action}?`)) {
      return;
    }

    try {
      const userId = user.uid || user.id;
      const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
      const querySnapshot = await getDocsQuery(userQuery);

      if (querySnapshot.empty) {
        await updateDoc(doc(db, 'users', user.id), {
          isWineryVerified: !isVerified,
        });
      } else {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          isWineryVerified: !isVerified,
        });
      }

      // Wenn verifiziert wird, verifiziere auch das Weingut-Profil (falls vorhanden)
      if (!isVerified) {
        const wineryQuery = query(collection(db, 'wineries'), where('ownerId', '==', userId));
        const winerySnapshot = await getDocsQuery(wineryQuery);
        if (!winerySnapshot.empty) {
          const wineryDoc = winerySnapshot.docs[0];
          await updateDoc(doc(db, 'wineries', wineryDoc.id), {
            isVerified: true,
          });
        }
      } else {
        // Wenn Verifizierung entfernt wird, entferne auch vom Weingut-Profil
        const wineryQuery = query(collection(db, 'wineries'), where('ownerId', '==', userId));
        const winerySnapshot = await getDocsQuery(wineryQuery);
        if (!winerySnapshot.empty) {
          const wineryDoc = winerySnapshot.docs[0];
          await updateDoc(doc(db, 'wineries', wineryDoc.id), {
            isVerified: false,
          });
        }
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isWineryVerified: !isVerified } : u))
      );

      alert(`User wurde ${!isVerified ? 'als Weingut verifiziert' : 'Verifizierung entfernt'}!`);
    } catch (error) {
      console.error('Fehler beim Verifizieren:', error);
      alert(`User konnte nicht ${action} werden.`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !confirm(
        `Möchten Sie den User "${user.username || user.email}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nEs werden auch alle zugehörigen Daten gelöscht: Weine, Chats, Nachrichten.`
      )
    ) {
      return;
    }

    try {
      const userId = user.uid || user.id;

      // Lösche User aus Firestore
      await deleteDoc(doc(db, 'users', user.id));

      // Lösche auch alle zugehörigen Weine
      const winesQuery = query(collection(db, 'wines'), where('ownerId', '==', userId));
      const winesSnapshot = await getDocsQuery(winesQuery);
      if (!winesSnapshot.empty) {
        const winesBatch = writeBatch(db);
        winesSnapshot.docs.forEach((wineDoc) => {
          winesBatch.delete(wineDoc.ref);
        });
        await winesBatch.commit();
        console.log(`✅ ${winesSnapshot.docs.length} Weine gelöscht`);
      }

      // Lösche auch alle zugehörigen Chats (falls Chat-Teilnehmer)
      const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
      const chatsSnapshot = await getDocsQuery(chatsQuery);
      if (!chatsSnapshot.empty) {
        const chatsBatch = writeBatch(db);
        chatsSnapshot.docs.forEach((chatDoc) => {
          chatsBatch.update(chatDoc.ref, {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: 'admin-user-deletion',
          });
        });
        await chatsBatch.commit();
        console.log(`✅ ${chatsSnapshot.docs.length} Chats als gelöscht markiert`);
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      alert('User und alle zugehörigen Daten wurden gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('User konnte nicht gelöscht werden.');
    }
  };

  const handleCleanupUsers = async () => {
    if (
      !confirm(
        'Möchten Sie ALLE User löschen, außer dem Admin-Konto?\n\nDiese Aktion kann nicht rückgängig gemacht werden!\n\nEs werden ALLE Konten gelöscht, nur das Admin-Konto bleibt erhalten.'
      )
    ) {
      return;
    }

    try {
      const usersSnapshot = await getDocsQuery(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      const correctAdmin =
        allUsers.find(
          (user) => user.isAdmin === true && (user.email === 'admin@bottle-trade.de' || user.uid === 'admin-123')
        ) || allUsers.find((user) => user.isAdmin === true);

      if (!correctAdmin) {
        alert('Kein Admin-Account gefunden! Bereinigung abgebrochen.');
        return;
      }

      const usersToDelete = allUsers.filter((user) => user.id !== correctAdmin.id);

      const batchSize = 500;
      let deleteCount = 0;

      for (let i = 0; i < usersToDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchUsers = usersToDelete.slice(i, i + batchSize);

        batchUsers.forEach((user) => {
          batch.delete(doc(db, 'users', user.id));
          deleteCount++;
        });

        await batch.commit();
      }

      await updateDoc(doc(db, 'users', correctAdmin.id), {
        isAdmin: true,
        email: 'admin@bottle-trade.de',
        username: 'admin',
      });

      await loadUsers();

      alert(
        `${deleteCount} User wurden gelöscht.\n\nVerbleibendes Admin-Konto:\n${correctAdmin.email || correctAdmin.username || correctAdmin.id}`
      );
    } catch (error) {
      console.error('Fehler bei der Bereinigung:', error);
      alert('Bereinigung fehlgeschlagen: ' + (error as Error).message);
    }
  };

  const loadUserDetails = async (user: User) => {
    try {
      setIsLoadingUserDetails(true);
      setUserDetailsModalVisible(true);

      const userId = user.uid || user.id;

      // Lade alle relevanten Daten parallel
      const [winesSnapshot, chatsSnapshot, incomingTradesSnapshot, outgoingTradesSnapshot, wishesSnapshot, winerySnapshot] =
        await Promise.all([
          getDocsQuery(query(collection(db, 'wines'), where('ownerId', '==', userId))).catch(() => ({ docs: [] })),
          getDocsQuery(collection(db, 'chats')).catch(() => ({ docs: [] })),
          getDocsQuery(query(collection(db, 'tradeRequests'), where('toUserId', '==', userId))).catch(() => ({
            docs: [],
          })),
          getDocsQuery(query(collection(db, 'tradeRequests'), where('fromUserId', '==', userId))).catch(() => ({
            docs: [],
          })),
          getDocsQuery(query(collection(db, 'wishes'), where('userId', '==', userId))).catch(() => ({ docs: [] })),
          getDocsQuery(query(collection(db, 'wineries'), where('ownerId', '==', userId))).catch(() => ({ docs: [] })),
        ]);

      const wines = winesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const allChats = chatsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
      const incomingTrades = incomingTradesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const outgoingTrades = outgoingTradesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const wishes = wishesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const winery = winerySnapshot.docs.length > 0 ? { id: winerySnapshot.docs[0].id, ...winerySnapshot.docs[0].data() } : null;

      // Filtere Chats für diesen User
      const chats = allChats.filter((chat: any) => {
        if (chat.deleted === true) return false;
        if (chat.entryType === 'chat' || !chat.entryType) {
          return chat.participants && Array.isArray(chat.participants) && chat.participants.includes(userId);
        }
        if (chat.entryType === 'hint') {
          return chat.userId === userId;
        }
        return false;
      });

      const allTrades = [...incomingTrades, ...outgoingTrades];

      // Berechne Statistiken
      const publicWines = wines.filter((w: any) => w.isPublic === true || w.status === 'public');
      const privateWines = wines.filter((w: any) => w.isPublic !== true && w.status !== 'public');
      const tradedWines = wines.filter((w: any) => w.traded === true);

      const activeChats = chats.filter((c: any) => !c.deleted && c.type === 'chat');
      const hints = chats.filter((c: any) => !c.deleted && c.type === 'hint');

      const pendingTrades = allTrades.filter((t: any) => t.status === 'pending');
      const acceptedTrades = allTrades.filter((t: any) => t.status === 'accepted');
      const rejectedTrades = allTrades.filter((t: any) => t.status === 'rejected');
      const completedTrades = allTrades.filter((t: any) => t.status === 'completed');

      const wishesWithMatches = wishes.filter((w: any) => w.hasMatch === true);

      setUserDetailsData({
        user,
        statistics: {
          wines: {
            total: wines.length,
            public: publicWines.length,
            private: privateWines.length,
            traded: tradedWines.length,
          },
          chats: {
            total: activeChats.length,
            hints: hints.length,
          },
          trades: {
            total: allTrades.length,
            pending: pendingTrades.length,
            accepted: acceptedTrades.length,
            rejected: rejectedTrades.length,
            completed: completedTrades.length,
          },
          wishes: {
            total: wishes.length,
            withMatches: wishesWithMatches.length,
          },
          winery: winery
            ? {
                name: (winery as any).name || 'Unbekannt',
                verified: (winery as any).isVerified || false,
                hasProfile: true,
              }
            : null,
        },
        details: {
          wines: wines.slice(0, 10),
          chats: activeChats.slice(0, 10),
          trades: allTrades.slice(0, 10),
          wishes: wishes.slice(0, 10),
        },
      });
    } catch (error) {
      console.error('Fehler beim Laden der User-Details:', error);
      alert('User-Details konnten nicht geladen werden.');
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (user.username || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.firstName || '').toLowerCase().includes(searchLower) ||
      (user.lastName || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade User...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">User-Verwaltung</h1>
        <div className="text-white">
          Gesamt: {users.length} | Angezeigt: {filteredUsers.length}
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gray-800/50 rounded-lg border border-gold-light p-6 mb-6">
        <div className="text-white">
          <div className="text-lg font-bold mb-2">Gesamt: {users.length} User</div>
          <div className="text-sm text-gray-300">
            {users.filter((u) => u.isAdmin).length} Admin(s) • {users.filter((u) => !u.isAdmin).length} Standard-User
            {users.filter((u) => u.isBlocked).length > 0 && ` • ${users.filter((u) => u.isBlocked).length} Gesperrt`}
            {users.filter((u) => u.isWinery).length > 0 && ` • ${users.filter((u) => u.isWinery).length} Weingut(e)`}
            {users.filter((u) => u.isWinery && u.isWineryVerified).length > 0 &&
              ` • ${users.filter((u) => u.isWinery && u.isWineryVerified).length} Verifiziert`}
            {users.filter((u) => !u.isAdmin && (u.isActive || u.status === 'active')).length > 0 &&
              ` • ${users.filter((u) => !u.isAdmin && (u.isActive || u.status === 'active')).length} Aktiv`}
            {users.filter((u) => !u.isAdmin && (!u.isActive && u.status !== 'active')).length > 0 &&
              ` • ${users.filter((u) => !u.isAdmin && (!u.isActive && u.status !== 'active')).length} Inaktiv`}
          </div>
        </div>
      </div>

      {/* Cleanup Button */}
      <button
        onClick={handleCleanupUsers}
        className="mb-6 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold"
      >
        🧹 User-Datenbank bereinigen
      </button>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nach E-Mail oder Username suchen..."
          className="w-full max-w-md px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold"
        />
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                E-Mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {user.email || 'N/A'}
                  {user.isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-600 text-white text-xs rounded">👑 Admin</span>
                  )}
                  {user.isBlocked && (
                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded">🚫 Gesperrt</span>
                  )}
                  {user.isWinery && (
                    <span className={`ml-2 px-2 py-0.5 text-white text-xs rounded ${user.isWineryVerified ? 'bg-green-600' : 'bg-yellow-600'}`}>
                      {user.isWineryVerified ? '🏰 ✅ Verifiziert' : '🏰 ⏳ Nicht verifiziert'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {user.username || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.isBlocked
                          ? 'bg-red-900/50 text-red-200'
                          : user.status === 'active' || user.isActive
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                      }`}
                    >
                      {user.isBlocked ? 'Gesperrt' : user.status || 'N/A'}
                    </span>
                    {!user.isAdmin && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          isEmailConfirmed(user)
                            ? 'bg-blue-900/50 text-blue-200'
                            : 'bg-gray-700/50 text-gray-400'
                        }`}
                      >
                        {isEmailConfirmed(user) ? '✓ E-Mail bestätigt' : '○ E-Mail nicht bestätigt'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {user.subscriptionType === 'pro' ? (
                    <span className="text-purple-400">⭐ Pro</span>
                  ) : (
                    <span className="text-gray-400">📦 Basic</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => loadUserDetails(user)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                    >
                      👁️ Details
                    </button>
                    {user.isWinery && (
                      <button
                        onClick={() => handleVerifyWinery(user)}
                        className={`px-3 py-1 rounded text-xs ${
                          user.isWineryVerified
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        }`}
                      >
                        {user.isWineryVerified ? '✅ Verifiziert' : '⏳ Verifizieren'}
                      </button>
                    )}
                    {!user.isAdmin && (
                      <button
                        onClick={() => handleActivateUser(user)}
                        className={`px-3 py-1 rounded text-xs ${
                          user.isActive || user.status === 'active'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {(user.isActive || user.status === 'active') ? '✓ Aktiv' : '○ Inaktiv'}
                      </button>
                    )}
                    {!user.isAdmin && (
                      <button
                        onClick={() => handleToggleEmailConfirmed(user)}
                        className={`px-3 py-1 rounded text-xs ${
                          isEmailConfirmed(user)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {isEmailConfirmed(user) ? '✓ E-Mail' : '○ E-Mail'}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleBlock(user)}
                      className={`px-3 py-1 rounded text-xs ${
                        user.isBlocked
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {user.isBlocked ? '🔓 Entsperren' : '🔒 Sperren'}
                    </button>
                    {!user.isAdmin && (
                      <button
                        onClick={() => handleToggleSubscription(user)}
                        className={`px-3 py-1 rounded text-xs ${
                          user.subscriptionType === 'pro'
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }`}
                      >
                        {user.subscriptionType === 'pro' ? '⭐ Pro' : '📦 Basic'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
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

      {filteredUsers.length === 0 && (
        <div className="text-center text-gray-400 py-12">Keine User gefunden</div>
      )}

      {/* User Details Modal */}
      {userDetailsModalVisible && (
        <div className="fixed inset-0 bg-black/75 flex items-end justify-center z-50">
          <div className="bg-gray-800 rounded-t-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Vollständige User-Daten</h2>
              <button
                onClick={() => {
                  setUserDetailsModalVisible(false);
                  setUserDetailsData(null);
                }}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {isLoadingUserDetails ? (
                <div className="text-center text-white py-12">
                  <div className="text-xl">Lade User-Daten...</div>
                </div>
              ) : userDetailsData ? (
                <>
                  {/* Basis-Informationen */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">👤 Basis-Informationen</h3>
                    <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Username:</span>
                        <span className="text-white">{userDetailsData.user.username || 'Nicht gesetzt'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">E-Mail:</span>
                        <span className="text-white">{userDetailsData.user.email || 'Nicht gesetzt'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Name:</span>
                        <span className="text-white">
                          {userDetailsData.user.firstName || ''} {userDetailsData.user.lastName || ''}
                          {!userDetailsData.user.firstName && !userDetailsData.user.lastName && 'Nicht gesetzt'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Adresse:</span>
                        <span className="text-white">
                          {userDetailsData.user.street || ''} {userDetailsData.user.zipCode || ''}{' '}
                          {userDetailsData.user.city || ''}
                          {!userDetailsData.user.street && !userDetailsData.user.zipCode && !userDetailsData.user.city && 'Nicht gesetzt'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Registriert am:</span>
                        <span className="text-white">
                          {userDetailsData.user.createdAt
                            ? new Date(
                                userDetailsData.user.createdAt.toDate
                                  ? userDetailsData.user.createdAt.toDate()
                                  : userDetailsData.user.createdAt
                              ).toLocaleDateString('de-DE')
                            : 'Unbekannt'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Status:</span>
                        <span className="text-white">
                          {userDetailsData.user.isAdmin ? '👑 Admin' : 'Standard-User'}
                          {userDetailsData.user.isBlocked && ' • 🚫 Gesperrt'}
                          {userDetailsData.user.isWinery && ' • 🏰 Weingut'}
                          {userDetailsData.user.isWineryVerified && ' • ✅ Verifiziert'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Version:</span>
                        <span className="text-white">
                          {userDetailsData.user.subscriptionType === 'pro' ? '⭐ Pro' : '📦 Basic'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statistiken */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-4">📊 Statistiken</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-gold mb-2">{userDetailsData.statistics.wines.total}</div>
                        <div className="text-white font-semibold mb-1">Weine gesamt</div>
                        <div className="text-sm text-gray-300">
                          {userDetailsData.statistics.wines.public} öffentlich • {userDetailsData.statistics.wines.private} privat •{' '}
                          {userDetailsData.statistics.wines.traded} getauscht
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-gold mb-2">{userDetailsData.statistics.chats.total}</div>
                        <div className="text-white font-semibold mb-1">Chats</div>
                        <div className="text-sm text-gray-300">{userDetailsData.statistics.chats.hints} Hinweise</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-gold mb-2">{userDetailsData.statistics.trades.total}</div>
                        <div className="text-white font-semibold mb-1">Tauschanfragen</div>
                        <div className="text-sm text-gray-300">
                          {userDetailsData.statistics.trades.pending} offen • {userDetailsData.statistics.trades.accepted} angenommen •{' '}
                          {userDetailsData.statistics.trades.completed} abgeschlossen
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-gold mb-2">{userDetailsData.statistics.wishes.total}</div>
                        <div className="text-white font-semibold mb-1">Wünsche</div>
                        <div className="text-sm text-gray-300">{userDetailsData.statistics.wishes.withMatches} mit Matches</div>
                      </div>
                    </div>
                    {userDetailsData.statistics.winery && (
                      <div className="mt-4 bg-gray-700/50 rounded-lg p-4">
                        <div className="text-white font-semibold mb-2">🏰 Weingut-Informationen</div>
                        <div className="text-gray-300">Name: {userDetailsData.statistics.winery.name}</div>
                        <div className="text-gray-300">
                          Status: {userDetailsData.statistics.winery.verified ? '✅ Verifiziert' : '⏳ Nicht verifiziert'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weine */}
                  {userDetailsData.details.wines.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        🍷 Weine ({userDetailsData.details.wines.length} von {userDetailsData.statistics.wines.total})
                      </h3>
                      <div className="space-y-2">
                        {userDetailsData.details.wines.map((wine: any, index: number) => (
                          <div key={wine.id || index} className="bg-gray-700/50 rounded-lg p-3">
                            <div className="text-white font-semibold">{wine.name || 'Unbenannt'}</div>
                            <div className="text-sm text-gray-300">
                              {wine.weingut || 'Kein Weingut'} • {wine.year || 'Kein Jahrgang'}
                              {wine.isPublic || wine.status === 'public' ? ' • ✅ Öffentlich' : ' • 🔒 Privat'}
                              {wine.traded ? ' • 🔄 Getauscht' : ''}
                            </div>
                          </div>
                        ))}
                        {userDetailsData.statistics.wines.total > 10 && (
                          <div className="text-sm text-gray-400 italic text-center">
                            ... und {userDetailsData.statistics.wines.total - 10} weitere Weine
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chats */}
                  {userDetailsData.details.chats.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        💬 Chats ({userDetailsData.details.chats.length} von {userDetailsData.statistics.chats.total})
                      </h3>
                      <div className="space-y-2">
                        {userDetailsData.details.chats.map((chat: any, index: number) => (
                          <div key={chat.id || index} className="bg-gray-700/50 rounded-lg p-3">
                            <div className="text-white font-semibold">
                              Chat {chat.type === 'chat' ? '💬' : '💡'} {chat.entryType || chat.type}
                            </div>
                            <div className="text-sm text-gray-300">
                              Erstellt:{' '}
                              {chat.createdAt
                                ? new Date(chat.createdAt.toDate ? chat.createdAt.toDate() : chat.createdAt).toLocaleDateString('de-DE')
                                : 'Unbekannt'}
                              {chat.lastMessage && ` • Letzte Nachricht: ${chat.lastMessage.substring(0, 30)}...`}
                            </div>
                          </div>
                        ))}
                        {userDetailsData.statistics.chats.total > 10 && (
                          <div className="text-sm text-gray-400 italic text-center">
                            ... und {userDetailsData.statistics.chats.total - 10} weitere Chats
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trades */}
                  {userDetailsData.details.trades.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        🔄 Tauschanfragen ({userDetailsData.details.trades.length} von {userDetailsData.statistics.trades.total})
                      </h3>
                      <div className="space-y-2">
                        {userDetailsData.details.trades.map((trade: any, index: number) => (
                          <div key={trade.id || index} className="bg-gray-700/50 rounded-lg p-3">
                            <div className="text-white font-semibold">
                              Trade{' '}
                              {trade.status === 'pending'
                                ? '⏳'
                                : trade.status === 'accepted'
                                ? '✅'
                                : trade.status === 'rejected'
                                ? '❌'
                                : '🔄'}{' '}
                              {trade.status}
                            </div>
                            <div className="text-sm text-gray-300">
                              Erstellt:{' '}
                              {trade.createdAt
                                ? new Date(trade.createdAt.toDate ? trade.createdAt.toDate() : trade.createdAt).toLocaleDateString('de-DE')
                                : 'Unbekannt'}
                              {trade.wineId && ` • Wein-ID: ${trade.wineId}`}
                            </div>
                          </div>
                        ))}
                        {userDetailsData.statistics.trades.total > 10 && (
                          <div className="text-sm text-gray-400 italic text-center">
                            ... und {userDetailsData.statistics.trades.total - 10} weitere Tauschanfragen
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Wünsche */}
                  {userDetailsData.details.wishes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        ❤️ Wünsche ({userDetailsData.details.wishes.length} von {userDetailsData.statistics.wishes.total})
                      </h3>
                      <div className="space-y-2">
                        {userDetailsData.details.wishes.map((wish: any, index: number) => (
                          <div key={wish.id || index} className="bg-gray-700/50 rounded-lg p-3">
                            <div className="text-white font-semibold">
                              {wish.name || 'Unbenannter Wunsch'} {wish.hasMatch ? '❤️' : '♡'}
                            </div>
                            <div className="text-sm text-gray-300">
                              {wish.weingut || ''} {wish.year || ''} {wish.region || ''} {wish.rebsorte || ''}
                              {wish.hasMatch && ' • ✅ Match gefunden'}
                            </div>
                          </div>
                        ))}
                        {userDetailsData.statistics.wishes.total > 10 && (
                          <div className="text-sm text-gray-400 italic text-center">
                            ... und {userDetailsData.statistics.wishes.total - 10} weitere Wünsche
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
