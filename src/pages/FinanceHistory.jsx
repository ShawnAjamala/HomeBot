import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

export default function FinanceHistory() {
  const [transactions, setTransactions] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "transactions"), where("agentId", "==", user.uid));
      const snap = await getDocs(q);
      const txns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txns);
      const total = txns.reduce((sum, t) => sum + (t.agentEarnings || 0), 0);
      setTotalEarnings(total);
      setLoading(false);
    };
    fetchEarnings();
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading finance history...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">My Finance History</h2>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-lg font-semibold">Total Earnings (95% of sales)</p>
            <p className="text-3xl font-bold text-green-700">KSh {totalEarnings.toLocaleString()}</p>
          </div>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No sales yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map(t => (
                <div key={t.id} className="border rounded-lg p-4">
                  <p><strong>Property:</strong> {t.houseAddress}</p>
                  <p><strong>Sold Price:</strong> KSh {t.amount?.toLocaleString()}</p>
                  <p><strong>Your Earnings (95%):</strong> KSh {t.agentEarnings?.toLocaleString()}</p>
                  <p><strong>Buyer:</strong> {t.buyerName}</p>
                  <p><strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}