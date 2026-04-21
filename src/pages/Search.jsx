/**
 * Search – Browse approved properties with filters and favorites
 * 
 * Features:
 * - Search by address/description
 * - Filter by listing type (sale, rental, airbnb)
 * - Favorite toggle (localStorage)
 * - Grid view only (no list toggle requested but can be added)
 * - Uses inline custom hooks for data management
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Heart, Search as SearchIcon } from "lucide-react";

// ==================== Custom Hooks (inline) ====================

/**
 * useAvailableHouses – Fetch approved, unsold houses with optional listing type filter
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
      if (listingTypeFilter && listingTypeFilter !== "all") {
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
 * useFavorites – Manage favorites in localStorage
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

  return { favorites, toggleFavorite, loading };
};

/**
 * useSearchFilter – Filter houses by search term
 */
const useSearchFilter = (houses, searchTerm) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return houses;
    const term = searchTerm.toLowerCase();
    return houses.filter(h =>
      h.address?.toLowerCase().includes(term) ||
      h.description?.toLowerCase().includes(term)
    );
  }, [houses, searchTerm]);
};

// ==================== Main Component ====================

export default function Search() {
  const [role, setRole] = useState(null);
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { houses, loading, error } = useAvailableHouses(listingTypeFilter);
  const { favorites, toggleFavorite } = useFavorites();
  const filteredHouses = useSearchFilter(houses, searchTerm);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading properties...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Search Properties</h2>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by address or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
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

          {/* Property Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHouses.map(house => (
              <div key={house.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition">
                {house.images?.[0] && (
                  <img src={house.images[0]} alt={house.address} className="w-full h-40 object-cover rounded-lg mb-2" />
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{house.address}</h3>
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                      {house.listingType === "sale" ? "For Sale" : house.listingType === "rental" ? "For Rent" : "Airbnb"}
                    </span>
                  </div>
                  <button onClick={() => toggleFavorite(house.id)} className="text-red-500">
                    {favorites.includes(house.id) ? <Heart fill="red" size={18} /> : <Heart size={18} />}
                  </button>
                </div>
                <p className="text-green-700 font-bold mt-1">KSh {house.price?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{house.bedrooms} beds / {house.bathrooms} baths</p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{house.description}</p>
                <p className="text-xs text-gray-400 mt-2">Listed by: {house.agentName}</p>
              </div>
            ))}
            {filteredHouses.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">No properties match your search.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}