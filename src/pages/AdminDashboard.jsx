import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { Check, X, Home, Users } from "lucide-react";

export default function AdminDashboard() {
  const [pendingAgents, setPendingAgents] = useState([]);
  const [pendingHouses, setPendingHouses] = useState([]);
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("agents");

  useEffect(() => {
    const fetchData = async () => {
      // Fetch unapproved agents
      const agentsQuery = query(collection(db, "users"), where("role", "==", "agent"), where("approved", "==", false));
      const agentsSnap = await getDocs(agentsQuery);
      setPendingAgents(agentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch unapproved houses
      const housesQuery = query(collection(db, "houses"), where("approved", "==", false));
      const housesSnap = await getDocs(housesQuery);
      setPendingHouses(housesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      setLoading(false);
    };
    fetchData();
    setRole(localStorage.getItem("userRole") || "admin");
  }, []);

  const approveAgent = async (agentId) => {
    await updateDoc(doc(db, "users", agentId), { approved: true });
    setPendingAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const rejectAgent = async (agentId) => {
    // Optionally delete or just remove from list
    setPendingAgents(prev => prev.filter(a => a.id !== agentId));
  };

  const approveHouse = async (houseId) => {
    await updateDoc(doc(db, "houses", houseId), { approved: true });
    setPendingHouses(prev => prev.filter(h => h.id !== houseId));
  };

  const rejectHouse = async (houseId) => {
    setPendingHouses(prev => prev.filter(h => h.id !== houseId));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Admin Dashboard</h2>
          <div className="flex gap-4 mb-6 border-b">
            <button onClick={() => setActiveTab("agents")} className={`pb-2 px-4 ${activeTab === "agents" ? "border-b-2 border-green-600 text-green-700" : "text-gray-500"}`}>
              <Users className="inline mr-2" size={18} /> Pending Agents ({pendingAgents.length})
            </button>
            <button onClick={() => setActiveTab("houses")} className={`pb-2 px-4 ${activeTab === "houses" ? "border-b-2 border-green-600 text-green-700" : "text-gray-500"}`}>
              <Home className="inline mr-2" size={18} /> Pending Houses ({pendingHouses.length})
            </button>
          </div>

          {activeTab === "agents" && (
            <div className="space-y-3">
              {pendingAgents.length === 0 ? (
                <p className="text-gray-500">No pending agent approvals.</p>
              ) : (
                pendingAgents.map(agent => (
                  <div key={agent.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-sm text-gray-600">{agent.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveAgent(agent.id)} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><Check size={16} /> Approve</button>
                      <button onClick={() => rejectAgent(agent.id)} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"><X size={16} /> Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "houses" && (
            <div className="space-y-3">
              {pendingHouses.length === 0 ? (
                <p className="text-gray-500">No pending house approvals.</p>
              ) : (
                pendingHouses.map(house => (
                  <div key={house.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{house.address}</p>
                        <p className="text-sm text-gray-600">Price: KSh {house.price?.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Agent: {house.agentName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveHouse(house.id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                        <button onClick={() => rejectHouse(house.id)} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}