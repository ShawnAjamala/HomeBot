import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("admin");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("homebot_users") || "[]");
    setUsers(stored.filter(u => u.role === "buyer" || u.role === "agent"));
    const userRole = localStorage.getItem("userRole");
    if (userRole) setRole(userRole);
  }, []);

  const approveAgent = (userId) => {
    const allUsers = JSON.parse(localStorage.getItem("homebot_users") || "[]");
    const updated = allUsers.map(u => u.id === userId ? { ...u, approved: true } : u);
    localStorage.setItem("homebot_users", JSON.stringify(updated));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
  };

  const deleteUser = (userId) => {
    if (window.confirm("Delete this user? Their properties will also be deleted.")) {
      let allUsers = JSON.parse(localStorage.getItem("homebot_users") || "[]");
      allUsers = allUsers.filter(u => u.id !== userId);
      localStorage.setItem("homebot_users", JSON.stringify(allUsers));
      let allProps = JSON.parse(localStorage.getItem("homebot_properties") || "[]");
      allProps = allProps.filter(p => p.agentId !== userId);
      localStorage.setItem("homebot_properties", JSON.stringify(allProps));
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Manage Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                    <td className="px-6 py-4">{u.role === "agent" ? (u.approved ? <span className="text-green-600">Approved</span> : <span className="text-yellow-600">Pending</span>) : <span className="text-gray-500">N/A</span>}</td>
                    <td className="px-6 py-4 flex gap-2">
                      {u.role === "agent" && !u.approved && <button onClick={() => approveAgent(u.id)} className="text-green-600"><Check size={18} /></button>}
                      <button onClick={() => deleteUser(u.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-gray-500">No buyers or agents found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}