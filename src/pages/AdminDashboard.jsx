/**
 * AdminDashboard – Pending approvals for agents and properties
 * 
 * Displays two tabs: pending agents and pending properties.
 * Uses inline custom hooks to fetch and manage large data efficiently.
 * Supports listing types: sale, rental, airbnb.
 */

import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { Check, Home, Users } from "lucide-react";
import { useToast, useConfirm } from "../components/NotificationManager";

// ==================== Custom Hooks (inline) ====================

/**
 * usePendingAgents – Fetches unapproved agents
 */
const usePendingAgents = () => {
  const [pendingAgents, setPendingAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchPendingAgents = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "agent"), where("approved", "==", false));
      const snapshot = await getDocs(q);
      setPendingAgents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveAgent = useCallback(async (agentId) => {
    try {
      await updateDoc(doc(db, "users", agentId), { approved: true });
      setPendingAgents(prev => prev.filter(a => a.id !== agentId));
      toast("Agent approved successfully");
    } catch (err) {
      toast("Failed to approve agent", "error");
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingAgents();
  }, [fetchPendingAgents]);

  return { pendingAgents, loading, error, approveAgent, refetch: fetchPendingAgents };
};

/**
 * usePendingProperties – Fetches unapproved properties
 * @param {string|null} listingTypeFilter - optional: "sale", "rental", "airbnb", or null for all
 */
const usePendingProperties = (listingTypeFilter = null) => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchPendingProperties = useCallback(async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "houses"), where("approved", "==", false));
      if (listingTypeFilter) {
        q = query(q, where("listingType", "==", listingTypeFilter));
      }
      const snapshot = await getDocs(q);
      setPendingProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [listingTypeFilter]);

  const approveProperty = useCallback(async (propertyId) => {
    try {
      await updateDoc(doc(db, "houses", propertyId), { approved: true });
      setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
      toast("Property approved");
    } catch (err) {
      toast("Failed to approve property", "error");
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingProperties();
  }, [fetchPendingProperties]);

  return { pendingProperties, loading, error, approveProperty, refetch: fetchPendingProperties };
};

// ==================== Main Component ====================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("agents");
  
  // Use custom hooks
  const { pendingAgents, loading: agentsLoading, approveAgent } = usePendingAgents();
  const { pendingProperties, loading: propertiesLoading, approveProperty } = usePendingProperties();

  if (agentsLoading || propertiesLoading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Admin Dashboard</h2>
      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setActiveTab("agents")} className={`pb-2 px-4 ${activeTab === "agents" ? "border-b-2 border-green-600 text-green-700" : "text-gray-500"}`}>
          <Users className="inline mr-2" size={18} /> Pending Agents ({pendingAgents.length})
        </button>
        <button onClick={() => setActiveTab("properties")} className={`pb-2 px-4 ${activeTab === "properties" ? "border-b-2 border-green-600 text-green-700" : "text-gray-500"}`}>
          <Home className="inline mr-2" size={18} /> Pending Properties ({pendingProperties.length})
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
                <button onClick={() => approveAgent(agent.id)} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1">
                  <Check size={16} /> Approve
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "properties" && (
        <div className="space-y-3">
          {pendingProperties.length === 0 ? (
            <p className="text-gray-500">No pending property approvals.</p>
          ) : (
            pendingProperties.map(property => (
              <div key={property.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{property.address}</p>
                  <p className="text-sm text-gray-600">Price: KSh {property.price?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Type: {property.listingType === "sale" ? "For Sale" : property.listingType === "rental" ? "For Rent" : "Airbnb"}</p>
                  <p className="text-sm text-gray-600">Agent: {property.agentName}</p>
                </div>
                <button onClick={() => approveProperty(property.id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}