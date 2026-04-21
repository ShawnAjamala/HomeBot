/**
 * AdminFinance – Admin view of all transactions, separated by listing type (sale, rental, airbnb)
 * Uses inline custom hooks to fetch and group data efficiently.
 */

import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

// ==================== Custom Hooks (inline) ====================

/**
 * useTransactionsByType – Fetches all transactions and groups them by listingType
 * Returns { groupedTransactions, totals, loading, error }
 */
const useTransactionsByType = () => {
  const [groupedTransactions, setGroupedTransactions] = useState({
    sale: [],
    rental: [],
    airbnb: [],
  });
  const [totals, setTotals] = useState({
    sale: 0,
    rental: 0,
    airbnb: 0,
    all: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "transactions"));
      const allTxns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Group by listingType
      const grouped = { sale: [], rental: [], airbnb: [] };
      let totalAll = 0;
      const typeTotals = { sale: 0, rental: 0, airbnb: 0 };

      allTxns.forEach(t => {
        const type = t.listingType || "sale"; // fallback for old records
        grouped[type].push(t);
        const profit = t.adminProfit || 0;
        typeTotals[type] += profit;
        totalAll += profit;
      });

      setGroupedTransactions(grouped);
      setTotals({ ...typeTotals, all: totalAll });
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

  return { groupedTransactions, totals, loading, error, refetch: fetchTransactions };
};

// ==================== Main Component ====================

export default function AdminFinance() {
  const [activeTab, setActiveTab] = useState("all"); // "all", "sale", "rental", "airbnb"
  const { groupedTransactions, totals, loading } = useTransactionsByType();
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading admin finance...</div>;

  // Get current transactions based on active tab
  const currentTransactions = activeTab === "all" 
    ? [...groupedTransactions.sale, ...groupedTransactions.rental, ...groupedTransactions.airbnb]
    : groupedTransactions[activeTab] || [];

  const currentTotal = activeTab === "all" ? totals.all : totals[activeTab];

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Admin Finance</h2>

          {/* Tabs for listing types */}
          <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-t-lg ${activeTab === "all" ? "bg-green-100 text-green-800 border-b-2 border-green-600" : "text-gray-600"}`}
            >
              All ({totals.all.toLocaleString()} KSh)
            </button>
            <button
              onClick={() => setActiveTab("sale")}
              className={`px-4 py-2 rounded-t-lg ${activeTab === "sale" ? "bg-green-100 text-green-800 border-b-2 border-green-600" : "text-gray-600"}`}
            >
              For Sale ({totals.sale.toLocaleString()} KSh)
            </button>
            <button
              onClick={() => setActiveTab("rental")}
              className={`px-4 py-2 rounded-t-lg ${activeTab === "rental" ? "bg-green-100 text-green-800 border-b-2 border-green-600" : "text-gray-600"}`}
            >
              For Rent ({totals.rental.toLocaleString()} KSh)
            </button>
            <button
              onClick={() => setActiveTab("airbnb")}
              className={`px-4 py-2 rounded-t-lg ${activeTab === "airbnb" ? "bg-green-100 text-green-800 border-b-2 border-green-600" : "text-gray-600"}`}
            >
              Airbnb ({totals.airbnb.toLocaleString()} KSh)
            </button>
          </div>

          {/* Summary card for current tab */}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-lg font-semibold">
              Total Commission Earned (5% of all {activeTab === "all" ? "listings" : activeTab === "sale" ? "sales" : activeTab === "rental" ? "rentals" : "Airbnb stays"})
            </p>
            <p className="text-3xl font-bold text-green-700">KSh {currentTotal.toLocaleString()}</p>
          </div>

          {/* Transactions table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Commission (5%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="px-6 py-4">{t.houseAddress}</td>
                    <td className="px-6 py-4 capitalize">{t.listingType || "sale"}</td>
                    <td className="px-6 py-4">KSh {t.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">KSh {t.adminProfit?.toLocaleString()}</td>
                    <td className="px-6 py-4">{t.agentName}</td>
                    <td className="px-6 py-4">{t.buyerName}</td>
                    <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {currentTransactions.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-4 text-gray-500">No transactions for this category.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}