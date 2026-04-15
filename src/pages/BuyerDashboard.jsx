import { useState, useEffect } from "react";
import { Search, Heart, MapPin, DollarSign, Home } from "lucide-react";

export default function BuyerDashboard({ user }) {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const allProps = JSON.parse(localStorage.getItem("homebot_properties") || "[]");
    const approved = allProps.filter(p => p.approved === true);
    setProperties(approved);
    const favs = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || "[]");
    setFavorites(favs);
  }, [user]);

  const toggleFavorite = (propId) => {
    let newFavs;
    if (favorites.includes(propId)) {
      newFavs = favorites.filter(id => id !== propId);
    } else {
      newFavs = [...favorites, propId];
    }
    setFavorites(newFavs);
    localStorage.setItem(`favorites_${user.uid}`, JSON.stringify(newFavs));
  };

  const filtered = properties.filter(p => p.address?.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2 mb-4">
          <Search className="text-green-600" /> Find Your Dream Home
        </h2>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search by address or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{p.address}</h3>
                <button onClick={() => toggleFavorite(p.id)} className="text-red-500">{favorites.includes(p.id) ? <Heart fill="red" size={18} /> : <Heart size={18} />}</button>
              </div>
              <p className="text-green-700 font-bold mt-1">${p.price?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{p.bedrooms} beds / {p.bathrooms} baths</p>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>
              <p className="text-xs text-gray-400 mt-2">Listed by: {p.agentName}</p>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No approved properties yet</div>}
        </div>
      </div>
    </div>
  );
}