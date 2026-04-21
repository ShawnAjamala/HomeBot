/**
 * AgentDashboard – Agent overview
 * 
 * Shows statistics (listings, approved, sold, total earnings) and recent payments.
 * Uses inline custom hooks for data fetching and error handling.
 * Supports all listing types (sale, rental, airbnb) aggregated.
 */

import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { Home, DollarSign, CheckCircle, Clock, PlusCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/NotificationManager";

// ==================== Custom Hooks (inline) ====================

/**
 * useAgentApprovalStatus – Checks if the current agent is approved by admin.
 * Returns { isApproved, loading, error }
 */
const useAgentApprovalStatus = () => {
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const approved = userDoc.data()?.approved || false;
      setIsApproved(approved);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { isApproved, loading, error, refetch: fetchStatus };
};

/**
 * useAgentStats – Fetches agent's houses and earnings.
 * Returns { stats, recentTransactions, loading, error, refetch }
 */
const useAgentStats = (isApproved) => {
  const [stats, setStats] = useState({ totalListings: 0, approvedListings: 0, soldListings: 0, totalEarnings: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || !isApproved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
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
      const sorted = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentTransactions(sorted.slice(0, 5));
      setStats({ totalListings: total, approvedListings: approvedCount, soldListings: soldCount, totalEarnings });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isApproved]);

  useEffect(() => {
    if (isApproved) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isApproved, fetchStats]);

  return { stats, recentTransactions, loading, error, refetch: fetchStats };
};

// ==================== Main Component ====================

export default function AgentDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  // Use custom hooks
  const { isApproved, loading: approvalLoading, error: approvalError } = useAgentApprovalStatus();
  const { stats, recentTransactions, loading: statsLoading, error: statsError } = useAgentStats(isApproved);

  // Handle loading states
  if (approvalLoading || statsLoading) return <div>Loading dashboard...</div>;

  // Show approval pending message
  if (!isApproved && !approvalLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-yellow-800">Account Pending Approval</h2>
        <p className="text-yellow-700 mt-2">Your agent account is awaiting admin approval. You'll be able to list properties once approved.</p>
      </div>
    );
  }

  // Show error if any
  if (approvalError || statsError) {
    return <div className="text-red-600 p-4">Error loading data: {approvalError || statsError}</div>;
  }

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
          <button onClick={() => navigate("/my-listings")} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <PlusCircle size={18} /> Add New Listing
          </button>
          <button onClick={() => navigate("/my-listings")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Eye size={18} /> View All Listings
          </button>
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
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Earnings (95%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="px-6 py-4">{t.houseAddress} ({t.listingType === "sale" ? "Sale" : t.listingType === "rental" ? "Rent" : "Airbnb"})</td>
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