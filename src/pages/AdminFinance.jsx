import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

export default function AdminFinance() {
  const [transactions, setTransactions] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      const snap = await getDocs(collection(db, "transactions"));
      const txns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txns);
      const total = txns.reduce((sum, t) => sum + (t.adminProfit || 0), 0);
      setTotalProfit(total);
      setLoading(false);
    };
    fetchTransactions();
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading admin finance...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Admin Finance</h2>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-lg font-semibold">Total Commission Earned (5% of all sales)</p>
            <p className="text-3xl font-bold text-green-700">KSh {totalProfit.toLocaleString()}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Commission (5%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className="px-6 py-4">{t.houseAddress}</td>
                    <td className="px-6 py-4">KSh {t.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">KSh {t.adminProfit?.toLocaleString()}</td>
                    <td className="px-6 py-4">{t.agentName}</td>
                    <td className="px-6 py-4">{t.buyerName}</td>
                    <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-4 text-gray-500">No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}