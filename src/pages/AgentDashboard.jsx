import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { PlusCircle, Home, Edit2, Trash2, Eye, Upload } from "lucide-react";

export default function AgentDashboard() {
  const [houses, setHouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [formData, setFormData] = useState({ address: "", price: "", bedrooms: "", bathrooms: "", description: "", images: [] });
  const [role, setRole] = useState("agent");
  const [loading, setLoading] = useState(true);
  const [agentApproved, setAgentApproved] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showPayments, setShowPayments] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Check if agent is approved
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const approved = userDoc.data()?.approved || false;
      setAgentApproved(approved);

      if (approved) {
        // Fetch agent's houses
        const q = query(collection(db, "houses"), where("agentId", "==", user.uid));
        const snap = await getDocs(q);
        setHouses(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch payments for agent's houses
        const houseIds = snap.docs.map(d => d.id);
        if (houseIds.length > 0) {
          const transQuery = query(collection(db, "transactions"), where("houseId", "in", houseIds));
          const transSnap = await getDocs(transQuery);
          setTransactions(transSnap.docs.map(t => ({ id: t.id, ...t.data() })));
        }
      }
      setLoading(false);
    };
    fetchData();
    setRole(localStorage.getItem("userRole") || "agent");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const houseData = {
      ...formData,
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      agentId: user.uid,
      agentName: localStorage.getItem("userName") || "Agent",
      approved: false,
      sold: false,
      createdAt: new Date().toISOString()
    };
    if (editingHouse) {
      await updateDoc(doc(db, "houses", editingHouse.id), houseData);
      setHouses(prev => prev.map(h => h.id === editingHouse.id ? { ...h, ...houseData } : h));
    } else {
      const docRef = await addDoc(collection(db, "houses"), houseData);
      setHouses([...houses, { id: docRef.id, ...houseData }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingHouse(null);
    setFormData({ address: "", price: "", bedrooms: "", bathrooms: "", description: "", images: [] });
  };

  const deleteHouse = async (id) => {
    if (window.confirm("Delete this house?")) {
      await deleteDoc(doc(db, "houses", id));
      setHouses(prev => prev.filter(h => h.id !== id));
    }
  };

  if (!agentApproved && !loading) {
    return (
      <div>
        <Navbar role={role} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800">Account Pending Approval</h2>
            <p className="text-yellow-700 mt-2">Your agent account is awaiting admin approval. You'll be able to list houses once approved.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-800">My Listings</h2>
            <div className="flex gap-2">
              <button onClick={() => setShowPayments(!showPayments)} className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-1">
                <Eye size={18} /> {showPayments ? "Hide Payments" : "View Payments"}
              </button>
              <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1">
                <PlusCircle size={18} /> Add House
              </button>
            </div>
          </div>

          {showPayments && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Payment Notifications</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-500">No payments yet.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(t => (
                    <div key={t.id} className="border-b pb-2">
                      <p><strong>House:</strong> {houses.find(h => h.id === t.houseId)?.address || t.houseId}</p>
                      <p><strong>Buyer:</strong> {t.buyerName}</p>
                      <p><strong>Amount:</strong> KSh {t.amount?.toLocaleString()}</p>
                      <p><strong>PIN:</strong> {t.paymentPin}</p>
                      <p><strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">{editingHouse ? "Edit House" : "Add New House"}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded" required />
                <input type="number" placeholder="Price (KSh)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-2 border rounded" required />
                <input type="number" placeholder="Bedrooms" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} className="w-full p-2 border rounded" required />
                <input type="number" placeholder="Bathrooms" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} className="w-full p-2 border rounded" required />
                <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="3" className="w-full p-2 border rounded"></textarea>
                {/* Image upload placeholder – you can integrate Cloudinary widget here */}
                <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded">{editingHouse ? "Update" : "Submit for Approval"}</button>
                <button type="button" onClick={resetForm} className="ml-2 bg-gray-300 px-4 py-2 rounded">Cancel</button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {houses.map(house => (
              <div key={house.id} className="border border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-lg">{house.address}</h3>
                <p className="text-green-700 font-semibold">KSh {house.price?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{house.bedrooms} beds / {house.bathrooms} baths</p>
                <p className="text-sm text-gray-500 mt-2">{house.description.substring(0, 100)}...</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEditingHouse(house); setFormData(house); setShowForm(true); }} className="text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => deleteHouse(house.id)} className="text-red-600"><Trash2 size={18} /></button>
                </div>
                <p className="text-xs mt-2">{house.approved ? <span className="text-green-600">Approved</span> : <span className="text-yellow-600">Pending Approval</span>}</p>
                {house.sold && <p className="text-red-600 text-sm mt-1">SOLD</p>}
              </div>
            ))}
            {houses.length === 0 && <p className="text-gray-500 col-span-2">No houses listed yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}