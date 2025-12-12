import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    winesInBoerse: 0,
    winesInRegals: 0,
    loading: true,
  });

  useEffect(() => {
    // Echtzeit-Subscription für aktive User
    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const activeCount = snapshot.docs.filter((doc) => {
        const userData = doc.data();
        return !userData.isBlocked;
      }).length;
      setStats((prev) => ({ ...prev, activeUsers: activeCount, loading: false }));
    });

    // Echtzeit-Subscription für Weine in Weinbörse
    const publicWinesUnsubscribe = onSnapshot(
      query(collection(db, 'wines'), where('status', '==', 'public')),
      (snapshot) => {
        setStats((prev) => ({ ...prev, winesInBoerse: snapshot.docs.length }));
      }
    );

    // Echtzeit-Subscription für alle Weine
    const allWinesUnsubscribe = onSnapshot(collection(db, 'wines'), (snapshot) => {
      const count = snapshot.docs.filter((doc) => {
        const wineData = doc.data();
        return wineData.status !== 'traded';
      }).length;
      setStats((prev) => ({ ...prev, winesInRegals: count }));
    });

    return () => {
      usersUnsubscribe();
      publicWinesUnsubscribe();
      allWinesUnsubscribe();
    };
  }, []);

  if (stats.loading) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-xl">Lade Statistiken...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
          <div className="text-gray-400 text-sm mb-2">Aktive User</div>
          <div className="text-3xl font-bold text-gold">{stats.activeUsers}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
          <div className="text-gray-400 text-sm mb-2">Weine in Weinbörse</div>
          <div className="text-3xl font-bold text-gold">{stats.winesInBoerse}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
          <div className="text-gray-400 text-sm mb-2">Weine in Weinregals</div>
          <div className="text-3xl font-bold text-gold">{stats.winesInRegals}</div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gold-light">
        <h2 className="text-xl font-bold text-white mb-4">Willkommen im Admin-Bereich</h2>
        <p className="text-gray-300">
          Dies ist die MVP-Version des Admin-Web-Backends. Weitere Features werden schrittweise hinzugefügt.
        </p>
      </div>
    </div>
  );
}











