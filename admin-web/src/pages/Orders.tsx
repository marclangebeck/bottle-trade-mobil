import { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  total: number;
  createdAt?: any;
  items?: any[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      let ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      if (filterStatus) {
        ordersData = ordersData.filter((order) => order.status === filterStatus);
      }

      setOrders(ordersData);
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      let ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      if (filterStatus) {
        ordersData = ordersData.filter((order) => order.status === filterStatus);
      }
      setOrders(ordersData);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      alert('Bestell-Status wurde aktualisiert.');
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren des Status');
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
        <div className="text-xl">Lade Bestellungen...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Bestellungen-Verwaltung</h1>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        >
          <option value="">Alle Status</option>
          <option value="pending">Ausstehend</option>
          <option value="paid">Bezahlt</option>
          <option value="shipped">Versendet</option>
          <option value="delivered">Geliefert</option>
          <option value="cancelled">Storniert</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-gray-800 rounded-lg border border-gold-light overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-300">Keine Bestellungen vorhanden</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Bestellnummer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Gesamt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-white">{order.orderNumber || order.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{order.userId?.substring(0, 8) || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'paid'
                          ? 'bg-green-900/50 text-green-200'
                          : order.status === 'shipped'
                          ? 'bg-blue-900/50 text-blue-200'
                          : order.status === 'delivered'
                          ? 'bg-purple-900/50 text-purple-200'
                          : order.status === 'cancelled'
                          ? 'bg-red-900/50 text-red-200'
                          : 'bg-yellow-900/50 text-yellow-200'
                      }`}
                    >
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{order.total?.toFixed(2) || '0.00'} €</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        Details
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                      >
                        <option value="pending">Ausstehend</option>
                        <option value="paid">Bezahlt</option>
                        <option value="shipped">Versendet</option>
                        <option value="delivered">Geliefert</option>
                        <option value="cancelled">Storniert</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gold-light p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Bestellungs-Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Bestellnummer</label>
                <div className="text-white">{selectedOrder.orderNumber || selectedOrder.id}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Status</label>
                <div className="text-white">{selectedOrder.status}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Gesamt</label>
                <div className="text-white">{selectedOrder.total?.toFixed(2) || '0.00'} €</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Datum</label>
                <div className="text-white">{formatDate(selectedOrder.createdAt)}</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
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








