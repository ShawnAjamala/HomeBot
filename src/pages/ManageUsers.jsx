/**
 * ManageUsers – Admin panel for managing buyers and agents
 * 
 * Features:
 * - Filter by role (All, Buyers, Agents)
 * - Approve pending agents
 * - Disapprove approved agents
 * - Delete users (and their associated properties)
 * - Uses inline custom hooks for data management
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { Check, Trash2, Users, UserCheck, UserX, X } from "lucide-react";
import Navbar from "../components/Navbar";
import { useConfirm, useToast } from "../components/NotificationManager";

// ==================== Custom Hooks (inline) ====================

/**
 * useUsers – Fetch and manage users (buyers + agents)
 * Returns { users, loading, error, approveAgent, disapproveAgent, deleteUser, refetch }
 */
const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const confirm = useConfirm();
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allUsers.filter(u => u.role === "buyer" || u.role === "agent");
      setUsers(filtered);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveAgent = useCallback(async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { approved: true });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
      toast("Agent approved successfully");
    } catch (err) {
      toast("Failed to approve agent", "error");
    }
  }, [toast]);

  const disapproveAgent = useCallback(async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { approved: false });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: false } : u));
      toast("Agent disapproved. They will no longer have access.", "error");
    } catch (err) {
      toast("Failed to disapprove agent", "error");
    }
  }, [toast]);

  const deleteUser = useCallback(async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      const propsSnap = await getDocs(query(collection(db, "houses"), where("agentId", "==", userId)));
      for (const prop of propsSnap.docs) {
        await deleteDoc(doc(db, "houses", prop.id));
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast("User deleted successfully");
    } catch (err) {
      toast("Failed to delete user", "error");
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, approveAgent, disapproveAgent, deleteUser, refetch: fetchUsers };
};

/**
 * useUserFilters – Filter users by role (all, buyer, agent)
 */
const useUserFilters = (users, filterRole) => {
  return useMemo(() => {
    if (filterRole === "all") return users;
    return users.filter(u => u.role === filterRole);
  }, [users, filterRole]);
};

// ==================== Main Component ====================

export default function ManageUsers() {
  const [role, setRole] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const { users, loading, error, approveAgent, disapproveAgent, deleteUser } = useUsers();
  const filteredUsers = useUserFilters(users, filterRole);
  const confirm = useConfirm();
  const toast = useToast();

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const totalBuyers = users.filter(u => u.role === "buyer").length;
  const totalAgents = users.filter(u => u.role === "agent").length;
  const pendingAgents = users.filter(u => u.role === "agent" && !u.approved).length;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Manage Users</h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
              <Users className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-500">Total Buyers</p>
                <p className="text-2xl font-bold">{totalBuyers}</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
              <UserCheck className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-500">Total Agents</p>
                <p className="text-2xl font-bold">{totalAgents}</p>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg flex items-center gap-3">
              <UserX className="text-yellow-600" size={24} />
              <div>
                <p className="text-sm text-gray-500">Pending Agents</p>
                <p className="text-2xl font-bold">{pendingAgents}</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setFilterRole("all")}
              className={`px-4 py-2 rounded-t-lg transition ${
                filterRole === "all"
                  ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setFilterRole("buyer")}
              className={`px-4 py-2 rounded-t-lg transition ${
                filterRole === "buyer"
                  ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Buyers ({totalBuyers})
            </button>
            <button
              onClick={() => setFilterRole("agent")}
              className={`px-4 py-2 rounded-t-lg transition ${
                filterRole === "agent"
                  ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Agents ({totalAgents})
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                    <td className="px-6 py-4">
                      {u.role === "agent" ? (
                        u.approved ? (
                          <span className="text-green-600">Approved</span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {u.role === "agent" && !u.approved && (
                        <button onClick={() => approveAgent(u.id)} className="text-green-600" title="Approve">
                          <Check size={18} />
                        </button>
                      )}
                      {u.role === "agent" && u.approved && (
                        <button onClick={() => confirm("Disapprove Agent", "This agent will lose access to the platform. Continue?", () => disapproveAgent(u.id))} className="text-red-600" title="Disapprove">
                          <X size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => confirm("Delete User", "This will permanently delete the user and all their properties.", () => deleteUser(u.id))}
                        className="text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-4 text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}