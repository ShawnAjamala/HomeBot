import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

export default function PurchaseHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "transactions"), where("buyerId", "==", user.uid));
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchPurchases();
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading purchase history...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">My Purchase History</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">You haven't purchased any property yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map(t => (
                <div key={t.id} className="border rounded-lg p-4 flex gap-4">
                  {t.houseImage && (
                    <img src={t.houseImage} alt="Property" className="w-32 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p><strong>Property:</strong> {t.houseAddress}</p>
                    <p><strong>Amount Paid:</strong> KSh {t.amount?.toLocaleString()}</p>
                    <p><strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}</p>
                    <p><strong>Phone:</strong> {t.buyerPhone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}