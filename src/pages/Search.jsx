import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Heart, Search as SearchIcon } from "lucide-react";

export default function Search() {
  const [role, setRole] = useState(null);
  const [houses, setHouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHouses = async () => {
      const q = query(collection(db, "houses"), where("approved", "==", true), where("sold", "==", false));
      const snapshot = await getDocs(q);
      setHouses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const user = auth.currentUser;
      if (user) {
        const favs = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || "[]");
        setFavorites(favs);
      }
      setLoading(false);
    };
    fetchHouses();
    setRole(localStorage.getItem("userRole"));
  }, []);

  const toggleFavorite = (houseId) => {
    const user = auth.currentUser;
    if (!user) return;
    let newFavs;
    if (favorites.includes(houseId)) {
      newFavs = favorites.filter(id => id !== houseId);
    } else {
      newFavs = [...favorites, houseId];
    }
    setFavorites(newFavs);
    localStorage.setItem(`favorites_${user.uid}`, JSON.stringify(newFavs));
  };

  const filtered = houses.filter(h =>
    h.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Search Houses</h2>
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by address or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(house => (
              <div key={house.id} className="border border-green-200 rounded-lg p-4">
                {house.images?.[0] && <img src={house.images[0]} className="w-full h-40 object-cover rounded mb-2" />}
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{house.address}</h3>
                  <button onClick={() => toggleFavorite(house.id)} className="text-red-500">
                    {favorites.includes(house.id) ? <Heart fill="red" size={18} /> : <Heart size={18} />}
                  </button>
                </div>
                <p className="text-green-700 font-bold">KSh {house.price?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{house.bedrooms} beds / {house.bathrooms} baths</p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{house.description}</p>
                <p className="text-xs text-gray-400 mt-2">Listed by: {house.agentName}</p>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No houses match your search.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}