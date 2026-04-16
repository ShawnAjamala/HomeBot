import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Heart, Trash2 } from "lucide-react";

export default function Favorites() {
  const [role, setRole] = useState(null);
  const [favoriteHouses, setFavoriteHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const favIds = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || "[]");
      if (favIds.length === 0) {
        setFavoriteHouses([]);
        setLoading(false);
        return;
      }
      const q = query(collection(db, "houses"), where("approved", "==", true), where("sold", "==", false));
      const snapshot = await getDocs(q);
      const allHouses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allHouses.filter(h => favIds.includes(h.id));
      setFavoriteHouses(filtered);
      setLoading(false);
    };
    loadFavorites();
    setRole(localStorage.getItem("userRole"));
  }, []);

  const removeFavorite = (houseId) => {
    const user = auth.currentUser;
    if (!user) return;
    const favs = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || "[]");
    const newFavs = favs.filter(id => id !== houseId);
    localStorage.setItem(`favorites_${user.uid}`, JSON.stringify(newFavs));
    setFavoriteHouses(prev => prev.filter(h => h.id !== houseId));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Your Favorites</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteHouses.map(house => (
              <div key={house.id} className="border border-green-200 rounded-lg p-4">
                {house.images?.[0] && <img src={house.images[0]} className="w-full h-40 object-cover rounded mb-2" />}
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
            {favoriteHouses.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No favorites yet. Click the heart on houses you like.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}