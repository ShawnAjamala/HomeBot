import { PlusCircle, Home, Calendar } from "lucide-react";

export default function AgentDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <PlusCircle className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">Add Listing</h3>
        <p className="text-gray-600 mt-2">Create a new property listing.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <Home className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">My Listings</h3>
        <p className="text-gray-600 mt-2">Edit or remove existing properties.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <Calendar className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">Showings</h3>
        <p className="text-gray-600 mt-2">Manage scheduled tours and inquiries.</p>
      </div>
    </div>
  );
}