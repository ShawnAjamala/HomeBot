import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Check, X, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";

export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const snapshot = await getDocs(collection(db, "houses"));
      const allProps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(allProps);
      setLoading(false);
    };
    fetchProperties();
    setRole(localStorage.getItem("userRole"));
  }, []);

  const approveProperty = async (propId) => {
    await updateDoc(doc(db, "houses", propId), { approved: true });
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, approved: true } : p));
  };

  const disapproveProperty = async (propId) => {
    await updateDoc(doc(db, "houses", propId), { approved: false });
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, approved: false } : p));
  };

  const deleteProperty = async (propId) => {
    if (window.confirm("Delete this property permanently?")) {
      await deleteDoc(doc(db, "houses", propId));
      setProperties(prev => prev.filter(p => p.id !== propId));
    }
  };

  if (loading) return <div>Loading properties...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Manage Properties</h2>
          <div className="grid grid-cols-1 gap-4">
            {properties.map(prop => (
              <div key={prop.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4">
                {prop.images && prop.images.length > 0 && (
                  <img src={prop.images[0]} alt="Property" className="w-full md:w-48 h-32 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{prop.address}</h3>
                  <p className="text-green-700 font-semibold">KSh {prop.price?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{prop.bedrooms} beds / {prop.bathrooms} baths</p>
                  <p className="text-sm text-gray-500 mt-1">{prop.description?.substring(0, 100)}...</p>
                  <p className="text-xs text-gray-400 mt-1">Agent: {prop.agentName}</p>
                  <p className="text-xs mt-1">
                    Status: {prop.approved ? 
                      <span className="text-green-600">Approved</span> : 
                      <span className="text-yellow-600">Pending</span>
                    }
                    {prop.sold && <span className="text-red-600 ml-2">SOLD</span>}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {!prop.approved ? (
                    <button onClick={() => approveProperty(prop.id)} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1">
                      <Check size={16} /> Approve
                    </button>
                  ) : (
                    <button onClick={() => disapproveProperty(prop.id)} className="bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1">
                      <X size={16} /> Disapprove
                    </button>
                  )}
                  <button onClick={() => deleteProperty(prop.id)} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {properties.length === 0 && <p className="text-gray-500">No properties yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}