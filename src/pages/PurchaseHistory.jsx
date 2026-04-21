/**
 * PurchaseHistory – Buyer's purchase history with grid/list toggle and filters
 * 
 * Displays all properties the buyer has purchased.
 * Features:
 * - Grid (3 columns) / List view toggle (persists in localStorage)
 * - Filters: listing type (sale, rental, airbnb), search by address
 * - Uses inline custom hooks for data fetching and filtering
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Grid3x3, List, Search } from "lucide-react";

// ==================== Custom Hooks (inline) ====================

/**
 * usePurchaseTransactions – Fetch buyer's transactions
 */
const usePurchaseTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "transactions"), where("buyerId", "==", user.uid));
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
 * useLayoutPreference – Grid/List view toggle
 */
const useLayoutPreference = () => {
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem("purchaseHistory_layout") || "grid";
  });
  const updateLayout = useCallback((newLayout) => {
    setLayout(newLayout);
    localStorage.setItem("purchaseHistory_layout", newLayout);
  }, []);
  return { layout, setLayout: updateLayout };
};

/**
 * usePurchaseFilters – Filter transactions by search term and listing type
 */
const usePurchaseFilters = (transactions) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [listingTypeFilter, setListingTypeFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => t.houseAddress?.toLowerCase().includes(term));
    }
    if (listingTypeFilter !== "all") {
      filtered = filtered.filter(t => t.listingType === listingTypeFilter);
    }
    return filtered;
  }, [transactions, searchTerm, listingTypeFilter]);

  return { searchTerm, setSearchTerm, listingTypeFilter, setListingTypeFilter, filteredTransactions };
};

// ==================== Main Component ====================

export default function PurchaseHistory() {
  const [role, setRole] = useState(null);
  const { transactions, loading, error } = usePurchaseTransactions();
  const { layout, setLayout } = useLayoutPreference();
  const { searchTerm, setSearchTerm, listingTypeFilter, setListingTypeFilter, filteredTransactions } = usePurchaseFilters(transactions);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading purchase history...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold text-green-800">My Purchase History</h2>
            <div className="flex gap-2">
              <button onClick={() => setLayout("grid")} className={`p-2 rounded-md ${layout === "grid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                <Grid3x3 size={20} />
              </button>
              <button onClick={() => setLayout("list")} className={`p-2 rounded-md ${layout === "list" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by address..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <select
                value={listingTypeFilter}
                onChange={e => setListingTypeFilter(e.target.value)}
                className="p-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="sale">For Sale</option>
                <option value="rental">For Rent</option>
                <option value="airbnb">Airbnb</option>
              </select>
            </div>
          </div>

          {/* Display filtered purchases */}
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No purchases match the filters.</p>
          ) : layout === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTransactions.map(t => (
                <div key={t.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition">
                  {t.houseImage && <img src={t.houseImage} alt="Property" className="w-full h-40 object-cover rounded-lg mb-2" />}
                  <h3 className="font-bold text-lg">{t.houseAddress}</h3>
                  <p className="text-green-700 font-semibold">KSh {t.amount?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Type: {t.listingType === "sale" ? "Sale" : t.listingType === "rental" ? "Rent" : "Airbnb"}</p>
                  <p className="text-xs text-gray-500">Date: {new Date(t.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-400 mt-1">Phone: {t.buyerPhone}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map(t => (
                <div key={t.id} className="border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition">
                  {t.houseImage && <img src={t.houseImage} alt="Property" className="w-full sm:w-48 h-32 object-cover rounded-lg" />}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{t.houseAddress}</h3>
                        <p className="text-xs text-gray-500 mt-1">Type: {t.listingType === "sale" ? "Sale" : t.listingType === "rental" ? "Rent" : "Airbnb"}</p>
                      </div>
                      <p className="text-green-700 font-semibold">KSh {t.amount?.toLocaleString()}</p>
                    </div>
                    <p className="text-sm text-gray-600">Date: {new Date(t.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Phone: {t.buyerPhone}</p>
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