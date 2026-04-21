/**
 * FinanceHistory – Agent's earnings history, separated by listing type
 * 
 * Displays all transactions where the current agent is the seller.
 * Shows tabs for All, For Sale, For Rent, Airbnb.
 * Each transaction shows property address, sold price, agent's 95% earnings,
 * buyer name, listing type, and date.
 * Uses inline custom hooks for data fetching and grouping.
 */

import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

// ==================== Custom Hooks (inline) ====================

/**
 * useAgentTransactions – Fetch all transactions for the current agent
 * Returns { transactions, loading, error, refetch }
 */
const useAgentTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "transactions"), where("agentId", "==", user.uid));
      const snap = await getDocs(q);
      const txns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txns);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
};

/**
 * useGroupedFinance – Group transactions by listing type and calculate totals
 * @param {Array} transactions - List of transaction objects
 * @returns {Object} { groupedTransactions, totals, types }
 */
const useGroupedFinance = (transactions) => {
  const types = ["sale", "rental", "airbnb"];
  const grouped = { sale: [], rental: [], airbnb: [] };
  const totals = { sale: 0, rental: 0, airbnb: 0, all: 0 };

  transactions.forEach(t => {
    const type = t.listingType || "sale"; // fallback for old records
    if (grouped[type]) {
      grouped[type].push(t);
      totals[type] += t.agentEarnings || 0;
      totals.all += t.agentEarnings || 0;
    } else {
      // If unknown type, put in sale for safety
      grouped.sale.push(t);
      totals.sale += t.agentEarnings || 0;
      totals.all += t.agentEarnings || 0;
    }
  });

  return { groupedTransactions: grouped, totals, types };
};

// ==================== Main Component ====================

export default function FinanceHistory() {
  const [activeTab, setActiveTab] = useState("all");
  const [role, setRole] = useState(null);
  const { transactions, loading, error } = useAgentTransactions();
  const { groupedTransactions, totals, types } = useGroupedFinance(transactions);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading finance history...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  // Get current transactions and total based on active tab
  const currentTransactions = activeTab === "all"
    ? transactions
    : groupedTransactions[activeTab] || [];
  const currentTotal = activeTab === "all" ? totals.all : totals[activeTab];

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">My Finance History</h2>

          {/* Tab buttons for filtering by listing type */}
          <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-t-lg transition ${
                activeTab === "all"
                  ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              All ({totals.all.toLocaleString()} KSh)
            </button>
            <button
              onClick={() => setActiveTab("sale")}
              className={`px-4 py-2 rounded-t-lg transition ${
                activeTab === "sale"
                  ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              For Sale ({totals.sale.toLocaleString()} KSh)
            </button>
            <button
              onClick={() => setActiveTab("rental")}
              className={`px-4 py-2 rounded-t-lg transition ${
                activeTab === "rental"
                  ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              For Rent ({totals.rental.toLocaleString()} KSh)
            </button>
            <button
              onClick={() => setActiveTab("airbnb")}
              className={`px-4 py-2 rounded-t-lg transition ${
                activeTab === "airbnb"
                  ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Airbnb ({totals.airbnb.toLocaleString()} KSh)
            </button>
          </div>

          {/* Total earnings summary for the selected tab */}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-lg font-semibold">
              Total Earnings (95% of {activeTab === "all" ? "all sales" : activeTab === "sale" ? "sales" : activeTab === "rental" ? "rentals" : "Airbnb stays"})
            </p>
            <p className="text-3xl font-bold text-green-700">KSh {currentTotal.toLocaleString()}</p>
          </div>

          {/* List of transactions */}
          {currentTransactions.length === 0 ? (
            <p className="text-gray-500">No transactions for this category.</p>
          ) : (
            <div className="space-y-4">
              {currentTransactions.map(t => (
                <div key={t.id} className="border rounded-lg p-4">
                  <p><strong>Property:</strong> {t.houseAddress}</p>
                  <p><strong>Listing Type:</strong> {t.listingType === "sale" ? "For Sale" : t.listingType === "rental" ? "For Rent" : "Airbnb"}</p>
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