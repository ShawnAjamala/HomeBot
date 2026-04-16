/**
 * AgentDashboard – Agent overview
 * 
 * Shows statistics (listings, approved, sold, total earnings) and recent payments.
 * Does NOT contain listing management forms – those are in MyListings.jsx.
 * Uses useToast for feedback.
 */

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { Home, DollarSign, CheckCircle, Clock, PlusCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/NotificationManager";

export default function AgentDashboard() {
  const [stats, setStats] = useState({ totalListings: 0, approvedListings: 0, soldListings: 0, totalEarnings: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [agentApproved, setAgentApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Check if agent is approved by admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const approved = userDoc.data()?.approved || false;
      setAgentApproved(approved);

      if (approved) {
        // Fetch agent's houses
        const listingsQuery = query(collection(db, "houses"), where("agentId", "==", user.uid));
        const listingsSnap = await getDocs(listingsQuery);
        const listings = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const total = listings.length;
        const approvedCount = listings.filter(l => l.approved).length;
        const soldCount = listings.filter(l => l.sold).length;

        // Fetch transactions (payments) for this agent
        const transactionsQuery = query(collection(db, "transactions"), where("agentId", "==", user.uid));
        const transSnap = await getDocs(transactionsQuery);
        const transactions = transSnap.docs.map(t => ({ id: t.id, ...t.data() }));
        const totalEarnings = transactions.reduce((sum, t) => sum + (t.agentEarnings || 0), 0);

        // Sort by date descending, take latest 5
        const sorted = transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentTransactions(sorted.slice(0, 5));

        setStats({ totalListings: total, approvedListings: approvedCount, soldListings: soldCount, totalEarnings });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (!agentApproved && !loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-yellow-800">Account Pending Approval</h2>
        <p className="text-yellow-700 mt-2">Your agent account is awaiting admin approval. You'll be able to list properties once approved.</p>
      </div>
    );
  }

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center gap-3">
            <Home className="text-green-600" size={28} />
            <div><p className="text-sm text-gray-500">Total Listings</p><p className="text-2xl font-bold">{stats.totalListings}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={28} />
            <div><p className="text-sm text-gray-500">Approved Listings</p><p className="text-2xl font-bold">{stats.approvedListings}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center gap-3">
            <Clock className="text-green-600" size={28} />
            <div><p className="text-sm text-gray-500">Sold Listings</p><p className="text-2xl font-bold">{stats.soldListings}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex items-center gap-3">
            <DollarSign className="text-green-600" size={28} />
            <div><p className="text-sm text-gray-500">Total Earnings (95%)</p><p className="text-2xl font-bold text-green-700">KSh {stats.totalEarnings.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => navigate("/my-listings")} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusCircle size={18} /> Add New Listing</button>
          <button onClick={() => navigate("/my-listings")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Eye size={18} /> View All Listings</button>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500">No payments received yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr><th className="px-6 py-3 text-left">Property</th><th>Buyer</th><th>Amount Paid</th><th>Your Earnings (95%)</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="px-6 py-4">{t.houseAddress}</td>
                    <td className="px-6 py-4">{t.buyerName}</td>
                    <td className="px-6 py-4">KSh {t.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">KSh {t.agentEarnings?.toLocaleString()}</td>
                    <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}