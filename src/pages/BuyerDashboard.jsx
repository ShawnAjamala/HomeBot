import { Search, Heart, MapPin } from "lucide-react";

export default function BuyerDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <Search className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">Search Properties</h3>
        <p className="text-gray-600 mt-2">Filter by price, location, bedrooms, and more.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <Heart className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">Favorites</h3>
        <p className="text-gray-600 mt-2">Save and compare your top picks.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <MapPin className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">Neighborhoods</h3>
        <p className="text-gray-600 mt-2">Explore area insights and market trends.</p>
      </div>
    </div>
  );
}