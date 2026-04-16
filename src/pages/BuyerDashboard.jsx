import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import PaymentModal from "../components/PaymentModal";
import { Search, Heart, Home, ShoppingBag } from "lucide-react";
import { useToast } from "../components/NotificationManager";

export default function BuyerDashboard() {
  const [houses, setHouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "houses"), where("approved", "==", true), where("sold", "==", false));
      const snapshot = await getDocs(q);
      const housesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHouses(housesData);

      const favs = JSON.parse(localStorage.getItem(`favorites_${user.uid}`) || "[]");
      setFavorites(favs);

      const purchasesQuery = query(collection(db, "transactions"), where("buyerId", "==", user.uid));
      const purchasesSnap = await getDocs(purchasesQuery);
      setPurchasedCount(purchasesSnap.size);

      setLoading(false);
    };
    fetchData();
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

  const handlePaymentSuccess = () => {
    setSelectedHouse(null);
    setHouses(prev => prev.filter(h => h.id !== selectedHouse?.id));
    setPurchasedCount(prev => prev + 1);
    toast("Payment successful! The house is now yours.");
  };

  const filteredHouses = houses.filter(h =>
    h.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading properties...</div>;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-green-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><Home className="text-green-700" size={24} /></div>
          <div><p className="text-sm text-gray-500">Available Properties</p><p className="text-2xl font-bold text-gray-800">{houses.length}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-green-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><Heart className="text-green-700" size={24} /></div>
          <div><p className="text-sm text-gray-500">Your Favorites</p><p className="text-2xl font-bold text-gray-800">{favorites.length}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-green-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><ShoppingBag className="text-green-700" size={24} /></div>
          <div><p className="text-sm text-gray-500">Properties Purchased</p><p className="text-2xl font-bold text-gray-800">{purchasedCount}</p></div>
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
                {house.images?.[0] ? (
                  <img src={house.images[0]} alt={house.address} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center"><Home size={48} className="text-gray-400" /></div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800">{house.address}</h3>
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
                  <button onClick={() => setSelectedHouse(house)} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedHouse && <PaymentModal house={selectedHouse} onClose={() => setSelectedHouse(null)} onSuccess={handlePaymentSuccess} />}
    </div>
  );
}