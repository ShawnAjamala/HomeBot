import { Users, Home, Settings } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <Users className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">User Management</h3>
        <p className="text-gray-600 mt-2">View, edit, or remove platform users.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <Home className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">Property Moderation</h3>
        <p className="text-gray-600 mt-2">Review and approve property listings.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
        <Settings className="text-green-700 mb-3" size={32} />
        <h3 className="text-xl font-semibold text-green-800">Platform Settings</h3>
        <p className="text-gray-600 mt-2">Configure global options and preferences.</p>
      </div>
    </div>
  );
}