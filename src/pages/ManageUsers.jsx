import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { Check, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allUsers.filter(u => u.role === "buyer" || u.role === "agent");
      setUsers(filtered);
      setLoading(false);
    };
    fetchUsers();
    setRole(localStorage.getItem("userRole"));
  }, []);

  const approveAgent = async (userId) => {
    await updateDoc(doc(db, "users", userId), { approved: true });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Delete this user? This will also remove their properties.")) {
      await deleteDoc(doc(db, "users", userId));
      const propsSnap = await getDocs(query(collection(db, "houses"), where("agentId", "==", userId)));
      for (const prop of propsSnap.docs) {
        await deleteDoc(doc(db, "houses", prop.id));
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Manage Users</h2>
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
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                    <td className="px-6 py-4">
                      {u.role === "agent" ? (u.approved ? <span className="text-green-600">Approved</span> : <span className="text-yellow-600">Pending</span>) : <span className="text-gray-500">N/A</span>}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {u.role === "agent" && !u.approved && <button onClick={() => approveAgent(u.id)} className="text-green-600"><Check size={18} /></button>}
                      <button onClick={() => deleteUser(u.id)} className="text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}