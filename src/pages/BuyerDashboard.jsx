/**
 * BuyerDashboard – Main view for authenticated buyers
 * 
 * Uses inline custom hooks for:
 * - Fetching approved, unsold properties (with listing type filter)
 * - Managing favorites (localStorage)
 * - Fetching purchase count
 * - Search term state
 * 
 * Displays property grid with images, details, favorite toggle, and purchase modal.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import PaymentModal from "../components/PaymentModal";
import { Search, Heart, Home, ShoppingBag } from "lucide-react";
import { useToast } from "../components/NotificationManager";

// ==================== Custom Hooks (inline) ====================

/**
 * useAvailableHouses – Fetch approved, unsold properties
 * @param {string|null} listingTypeFilter - "sale", "rental", "airbnb", or null for all
 * Returns { houses, loading, error, refetch }
 */
const useAvailableHouses = (listingTypeFilter = null) => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHouses = useCallback(async () => {
    setLoading(true);
    try {
      let constraints = [
        where("approved", "==", true),
        where("sold", "==", false)
      ];
      if (listingTypeFilter) {
        constraints.push(where("listingType", "==", listingTypeFilter));
      }
      const q = query(collection(db, "houses"), ...constraints);
      const snapshot = await getDocs(q);
      setHouses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [listingTypeFilter]);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  return { houses, loading, error, refetch: fetchHouses };
};

/**
 * useFavorites – Manage user favorites in localStorage
 * Returns { favorites, toggleFavorite, isFavorite, loading }
 */
const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`favorites_${userId}`);
      setFavorites(stored ? JSON.parse(stored) : []);
    }
    setLoading(false);
  }, [userId]);

  const toggleFavorite = useCallback((houseId) => {
    setFavorites(prev => {
      const newFavs = prev.includes(houseId)
        ? prev.filter(id => id !== houseId)
        : [...prev, houseId];
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(newFavs));
      return newFavs;
    });
  }, [userId]);

  const isFavorite = useCallback((houseId) => favorites.includes(houseId), [favorites]);

  return { favorites, toggleFavorite, isFavorite, loading };
};

/**
 * usePurchasedCount – Fetch number of properties bought by the current user
 * Returns { purchasedCount, loading, error }
 */
const usePurchasedCount = () => {
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCount = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "transactions"), where("buyerId", "==", user.uid));
      const snapshot = await getDocs(q);
      setPurchasedCount(snapshot.size);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { purchasedCount, loading, error, refetch: fetchCount };
};

// ==================== Main Component ====================

export default function BuyerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [selectedHouse, setSelectedHouse] = useState(null);
  const toast = useToast();

  // Use custom hooks
  const { houses, loading: housesLoading } = useAvailableHouses(
    listingTypeFilter === "all" ? null : listingTypeFilter
  );
  const { favorites, toggleFavorite } = useFavorites();
  const { purchasedCount } = usePurchasedCount();

  // Filter houses by search term (address or description)
  const filteredHouses = useMemo(() => {
    if (!searchTerm.trim()) return houses;
    const term = searchTerm.toLowerCase();
    return houses.filter(h =>
      h.address?.toLowerCase().includes(term) ||
      h.description?.toLowerCase().includes(term)
    );
  }, [houses, searchTerm]);

  const handlePaymentSuccess = () => {
    setSelectedHouse(null);
    toast("Payment successful! The house is now yours.");
  };

  if (housesLoading) return <div>Loading properties...</div>;

  return (
    <div className="space-y-8">
      {/* Hero Section with Search Bar */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Find Your Dream Home</h1>
        <p className="text-green-100 mb-6">Discover the perfect property from our curated listings</p>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by address or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Listing Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setListingTypeFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            listingTypeFilter === "all"
              ? "bg-green-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setListingTypeFilter("sale")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            listingTypeFilter === "sale"
              ? "bg-green-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          For Sale
        </button>
        <button
          onClick={() => setListingTypeFilter("rental")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            listingTypeFilter === "rental"
              ? "bg-green-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          For Rent
        </button>
        <button
          onClick={() => setListingTypeFilter("airbnb")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            listingTypeFilter === "airbnb"
              ? "bg-green-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Airbnb
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-green-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><Home className="text-green-700" size={24} /></div>
          <div><p className="text-sm text-gray-500">Available Properties</p><p className="text-2xl font-bold">{filteredHouses.length}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-green-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><Heart className="text-green-700" size={24} /></div>
          <div><p className="text-sm text-gray-500">Your Favorites</p><p className="text-2xl font-bold">{favorites.length}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-green-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><ShoppingBag className="text-green-700" size={24} /></div>
          <div><p className="text-sm text-gray-500">Properties Purchased</p><p className="text-2xl font-bold">{purchasedCount}</p></div>
        </div>
      </div>

      {/* Property Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Featured Properties</h2>
        {filteredHouses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No properties match your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHouses.map(house => (
              <div key={house.id} className="border border-green-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                {/* Property image (first one) or placeholder */}
                {house.images?.[0] ? (
                  <img src={house.images[0]} alt={house.address} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center"><Home size={48} className="text-gray-400" /></div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{house.address}</h3>
                      <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        {house.listingType === "sale" ? "For Sale" : house.listingType === "rental" ? "For Rent" : "Airbnb"}
                      </span>
                    </div>
                    <button onClick={() => toggleFavorite(house.id)} className="text-red-500">
                      {favorites.includes(house.id) ? <Heart fill="red" size={20} /> : <Heart size={20} />}
                    </button>
                  </div>
                  <p className="text-green-700 font-bold text-xl mt-1">KSh {house.price?.toLocaleString()}</p>
                  <div className="flex gap-2 text-sm text-gray-500 mt-2">
                    <span>{house.bedrooms} beds</span> • <span>{house.bathrooms} baths</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{house.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Listed by: {house.agentName}</p>
                  <button
                    onClick={() => setSelectedHouse(house)}
                    className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedHouse && (
        <PaymentModal
          house={selectedHouse}
          onClose={() => setSelectedHouse(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}