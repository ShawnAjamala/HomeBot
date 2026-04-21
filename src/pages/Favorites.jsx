/**
 * Favorites – Buyer's saved properties
 * 
 * Displays all properties the user has favorited.
 * Features:
 * - Toggle between grid (3 columns) and list (single column with image on left)
 * - Remove favorite button
 * - Uses inline custom hooks for data fetching and layout preference
 */

import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Heart, Trash2, Grid3x3, List } from "lucide-react";

// ==================== Custom Hooks (inline) ====================

/**
 * useFavoritesList – Fetch favorite houses from Firestore based on localStorage IDs
 * Returns { favoriteHouses, loading, error, removeFavorite, refetch }
 */
const useFavoritesList = () => {
  const [favoriteHouses, setFavoriteHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const favIds = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || "[]");
      if (favIds.length === 0) {
        setFavoriteHouses([]);
        setLoading(false);
        return;
      }
      // Fetch only approved, unsold houses (favorites can be sold, but we show them anyway? For consistency, show all favorited)
      // Let's show all favorited houses regardless of sold status – buyer may still want to see them.
      const q = query(collection(db, "houses"), where("approved", "==", true));
      const snapshot = await getDocs(q);
      const allHouses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allHouses.filter(h => favIds.includes(h.id));
      setFavoriteHouses(filtered);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = useCallback((houseId) => {
    const user = auth.currentUser;
    if (!user) return;
    const favs = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || "[]");
    const newFavs = favs.filter(id => id !== houseId);
    localStorage.setItem(`favorites_${user.uid}`, JSON.stringify(newFavs));
    setFavoriteHouses(prev => prev.filter(h => h.id !== houseId));
  }, []);

  return { favoriteHouses, loading, error, removeFavorite, refetch: fetchFavorites };
};

/**
 * useLayoutPreference – Save and retrieve user's preferred layout (grid/list)
 * Returns { layout, setLayout }
 */
const useLayoutPreference = () => {
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem("favorites_layout") || "grid";
  });

  const updateLayout = useCallback((newLayout) => {
    setLayout(newLayout);
    localStorage.setItem("favorites_layout", newLayout);
  }, []);

  return { layout, setLayout: updateLayout };
};

// ==================== Main Component ====================

export default function Favorites() {
  const { favoriteHouses, loading, error, removeFavorite } = useFavoritesList();
  const { layout, setLayout } = useLayoutPreference();
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-800">Your Favorites</h2>
            {/* Layout Toggle Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setLayout("grid")}
                className={`p-2 rounded-md transition ${
                  layout === "grid"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title="Grid view (3 columns)"
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setLayout("list")}
                className={`p-2 rounded-md transition ${
                  layout === "list"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title="List view (single column with image)"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Conditional Rendering based on layout */}
          {favoriteHouses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No favorites yet. Click the heart on houses you like.
            </div>
          ) : layout === "grid" ? (
            // Grid view: 1 column on mobile, 2 on tablet, 3 on desktop
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteHouses.map(house => (
                <div key={house.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition">
                  {house.images?.[0] && (
                    <img src={house.images[0]} alt={house.address} className="w-full h-40 object-cover rounded-lg mb-2" />
                  )}
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{house.address}</h3>
                    <button onClick={() => removeFavorite(house.id)} className="text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-green-700 font-bold">KSh {house.price?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{house.bedrooms} beds / {house.bathrooms} baths</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{house.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Listed by: {house.agentName}</p>
                </div>
              ))}
            </div>
          ) : (
            // List view: single column, image on left, details on right
            <div className="space-y-4">
              {favoriteHouses.map(house => (
                <div key={house.id} className="border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition">
                  {house.images?.[0] && (
                    <img src={house.images[0]} alt={house.address} className="w-full sm:w-48 h-32 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{house.address}</h3>
                      <button onClick={() => removeFavorite(house.id)} className="text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-green-700 font-bold">KSh {house.price?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{house.bedrooms} beds / {house.bathrooms} baths</p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{house.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Listed by: {house.agentName}</p>
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