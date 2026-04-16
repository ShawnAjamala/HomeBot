import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import UploadWidget from "../components/UploadWIdget";
import { PlusCircle, Edit2, Trash2, X } from "lucide-react";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [formData, setFormData] = useState({
    address: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    description: "",
    images: []
  });
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "houses"), where("agentId", "==", user.uid));
      const snapshot = await getDocs(q);
      const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(listingsData);
      setLoading(false);
    };
    fetchListings();
    setRole(localStorage.getItem("userRole"));
  }, []);

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingListing(null);
    setFormData({ address: "", price: "", bedrooms: "", bathrooms: "", description: "", images: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const listingData = {
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
    if (editingListing) {
      await updateDoc(doc(db, "houses", editingListing.id), listingData);
      setListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, ...listingData } : l));
    } else {
      const docRef = await addDoc(collection(db, "houses"), listingData);
      setListings([...listings, { id: docRef.id, ...listingData }]);
    }
    resetForm();
  };

  const deleteListing = async (id) => {
    if (window.confirm("Delete this listing permanently?")) {
      await deleteDoc(doc(db, "houses", id));
      setListings(prev => prev.filter(l => l.id !== id));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-800">My Listings</h2>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <PlusCircle size={18} /> Add New Listing
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">{editingListing ? "Edit Listing" : "Add New Listing"}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Price (KSh)"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Bedrooms"
                  value={formData.bedrooms}
                  onChange={e => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Bathrooms"
                  value={formData.bathrooms}
                  onChange={e => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full p-2 border rounded"
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Property Images</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20">
                        <img src={img} className="w-full h-full object-cover rounded" alt="" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <UploadWidget
                    cloudName="dqxemsd9j"
                    uploadPreset="homebot_123"
                    onUpload={handleImageUpload}
                    buttonText="Upload Image"
                    multiple={true}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded">
                    {editingListing ? "Update" : "Submit for Approval"}
                  </button>
                  <button type="button" onClick={resetForm} className="bg-gray-300 px-4 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map(listing => (
              <div key={listing.id} className="border border-green-200 rounded-lg p-4">
                {listing.images && listing.images.length > 0 && (
                  <img src={listing.images[0]} alt="Property" className="w-full h-40 object-cover rounded-lg mb-2" />
                )}
                <h3 className="font-bold text-lg">{listing.address}</h3>
                <p className="text-green-700 font-semibold">KSh {listing.price?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{listing.bedrooms} beds / {listing.bathrooms} baths</p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{listing.description}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingListing(listing);
                      setFormData({
                        address: listing.address,
                        price: listing.price,
                        bedrooms: listing.bedrooms,
                        bathrooms: listing.bathrooms,
                        description: listing.description,
                        images: listing.images || []
                      });
                      setShowForm(true);
                    }}
                    className="text-blue-600"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteListing(listing.id)} className="text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-xs mt-2">
                  {listing.approved ? (
                    <span className="text-green-600">Approved</span>
                  ) : (
                    <span className="text-yellow-600">Pending Approval</span>
                  )}
                </p>
                {listing.sold && <p className="text-red-600 text-sm mt-1">SOLD</p>}
              </div>
            ))}
            {listings.length === 0 && <p className="text-gray-500 col-span-2">No listings yet. Add your first property!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}