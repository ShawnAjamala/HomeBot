/**
 * MyListings – Agent property management page
 * 
 * Features:
 * - Add/edit property with multiple images (Cloudinary)
 * - Form adapts to listing type (sale, rental, airbnb)
 * - Preview modal (eye icon) to view all images and full details
 * - Grid / List view toggle (persists in localStorage)
 * - Delete confirmation modal
 * - Colored icons for listing types
 * - Uses inline custom hooks for data management
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import UploadWidget from "../components/UploadWidget";
import { PlusCircle, Edit2, Trash2, X, Eye, Grid3x3, List, Home, Calendar, Plane } from "lucide-react";
import { useConfirm, useToast } from "../components/NotificationManager";

// ==================== Custom Hooks (inline) ====================

/**
 * useAgentListings – Fetch agent's properties
 */
const useAgentListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "houses"), where("agentId", "==", user.uid));
      const snapshot = await getDocs(q);
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const addListing = useCallback(async (listingData) => {
    const docRef = await addDoc(collection(db, "houses"), listingData);
    setListings(prev => [...prev, { id: docRef.id, ...listingData }]);
    return docRef.id;
  }, []);

  const updateListing = useCallback(async (id, listingData) => {
    await updateDoc(doc(db, "houses", id), listingData);
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...listingData } : l));
  }, []);

  const deleteListing = useCallback(async (id) => {
    await deleteDoc(doc(db, "houses", id));
    setListings(prev => prev.filter(l => l.id !== id));
  }, []);

  return { listings, loading, error, addListing, updateListing, deleteListing, refetch: fetchListings };
};

/**
 * useLayoutPreference – Grid/List view toggle
 */
const useLayoutPreference = () => {
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem("myListings_layout") || "grid";
  });
  const updateLayout = useCallback((newLayout) => {
    setLayout(newLayout);
    localStorage.setItem("myListings_layout", newLayout);
  }, []);
  return { layout, setLayout: updateLayout };
};

/**
 * useListingForm – Manage form state and submission, with dynamic fields based on listingType
 */
const useListingForm = (initialData = null, onSuccess) => {
  const [formData, setFormData] = useState({
    address: "",
    price: "",
    pricePeriod: "one-time", // one-time, per_month, per_night
    bedrooms: "",
    bathrooms: "",
    description: "",
    listingType: "sale", // sale, rental, airbnb
    images: [],
    // Additional fields for rental / airbnb
    securityDeposit: "",
    cleaningFee: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setFormData({
      address: "",
      price: "",
      pricePeriod: "one-time",
      bedrooms: "",
      bathrooms: "",
      description: "",
      listingType: "sale",
      images: [],
      securityDeposit: "",
      cleaningFee: "",
    });
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Auto‑adjust pricePeriod when listingType changes
    if (name === "listingType") {
      let defaultPeriod = "one-time";
      if (value === "rental") defaultPeriod = "per_month";
      if (value === "airbnb") defaultPeriod = "per_night";
      setFormData(prev => ({ ...prev, pricePeriod: defaultPeriod }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSuccess(formData);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    submitting,
    error,
    handleChange,
    handleImageUpload,
    removeImage,
    handleSubmit,
    resetForm,
    setFormData
  };
};

// Helper function to get listing type icon and color
const getListingTypeIcon = (type) => {
  switch (type) {
    case "sale":
      return { icon: Home, color: "bg-green-100 text-green-700" };
    case "rental":
      return { icon: Calendar, color: "bg-blue-100 text-blue-700" };
    case "airbnb":
      return { icon: Plane, color: "bg-purple-100 text-purple-700" };
    default:
      return { icon: Home, color: "bg-gray-100 text-gray-700" };
  }
};

// ==================== Main Component ====================

export default function MyListings() {
  const [role, setRole] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [previewListing, setPreviewListing] = useState(null);
  const { listings, loading, error, addListing, updateListing, deleteListing } = useAgentListings();
  const { layout, setLayout } = useLayoutPreference();
  const confirm = useConfirm();
  const toast = useToast();

  // Form submission handler
  const handleFormSuccess = async (formData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const listingData = {
      ...formData,
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : 0,
      cleaningFee: formData.cleaningFee ? Number(formData.cleaningFee) : 0,
      agentId: user.uid,
      agentName: localStorage.getItem("userName") || "Agent",
      approved: false,
      sold: false,
      createdAt: new Date().toISOString()
    };
    if (editingId) {
      await updateListing(editingId, listingData);
      toast("Listing updated successfully");
    } else {
      await addListing(listingData);
      toast("Listing submitted for approval");
    }
    setShowForm(false);
    setEditingId(null);
  };

  const { formData, submitting, formError, handleChange, handleImageUpload, removeImage, handleSubmit, resetForm, setFormData } = useListingForm(null, handleFormSuccess);

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  const startEdit = (listing) => {
    setEditingId(listing.id);
    setFormData(listing);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold text-green-800">My Listings</h2>
            <div className="flex gap-2">
              <button onClick={() => setLayout("grid")} className={`p-2 rounded-md ${layout === "grid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}><Grid3x3 size={20} /></button>
              <button onClick={() => setLayout("list")} className={`p-2 rounded-md ${layout === "list" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}><List size={20} /></button>
              <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusCircle size={18} /> Add New</button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-3">{editingId ? "Edit Listing" : "Add New Listing"}</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" name="price" placeholder="Price (KSh)" value={formData.price} onChange={handleChange} className="p-2 border rounded" required />
                  <select name="pricePeriod" value={formData.pricePeriod} onChange={handleChange} className="p-2 border rounded">
                    <option value="one-time">One-time (Sale)</option>
                    <option value="per_month">Per Month (Rent)</option>
                    <option value="per_night">Per Night (Airbnb)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" name="bedrooms" placeholder="Bedrooms" value={formData.bedrooms} onChange={handleChange} className="p-2 border rounded" />
                  <input type="number" name="bathrooms" placeholder="Bathrooms" value={formData.bathrooms} onChange={handleChange} className="p-2 border rounded" />
                </div>
                <select name="listingType" value={formData.listingType} onChange={handleChange} className="p-2 border rounded">
                  <option value="sale">For Sale</option>
                  <option value="rental">For Rent</option>
                  <option value="airbnb">Airbnb / Short-term</option>
                </select>

                {/* Dynamic fields based on listingType */}
                {formData.listingType === "rental" && (
                  <input type="number" name="securityDeposit" placeholder="Security Deposit (KSh)" value={formData.securityDeposit} onChange={handleChange} className="p-2 border rounded" />
                )}
                {formData.listingType === "airbnb" && (
                  <input type="number" name="cleaningFee" placeholder="Cleaning Fee (KSh)" value={formData.cleaningFee} onChange={handleChange} className="p-2 border rounded" />
                )}

                <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-2 border rounded" />
                <div>
                  <label className="block text-sm font-medium mb-1">Property Images</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20">
                        <img src={img} className="w-full h-full object-cover rounded" alt="" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1"><X size={14} className="text-white" /></button>
                      </div>
                    ))}
                  </div>
                  <UploadWidget cloudName="dqxemsd9j" uploadPreset="homebot_123" onUpload={handleImageUpload} buttonText="Upload Image" multiple={true} />
                </div>
                {formError && <div className="text-red-600 text-sm">{formError}</div>}
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={submitting} className="bg-green-700 text-white px-4 py-2 rounded">{submitting ? "Saving..." : (editingId ? "Update" : "Submit for Approval")}</button>
                  <button type="button" onClick={cancelEdit} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Listings Grid/List */}
          {listings.length === 0 ? (
            <p className="text-gray-500">No listings yet. Add your first property!</p>
          ) : layout === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => {
                const { icon: Icon, color } = getListingTypeIcon(listing.listingType);
                return (
                  <div key={listing.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition">
                    {listing.images?.[0] && <img src={listing.images[0]} alt="Property" className="w-full h-40 object-cover rounded-lg mb-2" />}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={color} />
                        <h3 className="font-bold text-lg">{listing.address}</h3>
                      </div>
                      <button onClick={() => setPreviewListing(listing)} className="text-blue-600" title="Preview"><Eye size={18} /></button>
                    </div>
                    <p className="text-green-700 font-semibold">KSh {listing.price?.toLocaleString()} {listing.pricePeriod === "per_month" ? "/month" : listing.pricePeriod === "per_night" ? "/night" : ""}</p>
                    {listing.listingType === "rental" && listing.securityDeposit > 0 && (
                      <p className="text-xs text-gray-500">Deposit: KSh {listing.securityDeposit?.toLocaleString()}</p>
                    )}
                    {listing.listingType === "airbnb" && listing.cleaningFee > 0 && (
                      <p className="text-xs text-gray-500">Cleaning fee: KSh {listing.cleaningFee?.toLocaleString()}</p>
                    )}
                    <p className="text-sm text-gray-600">{listing.bedrooms} beds / {listing.bathrooms} baths</p>
                    <p className="text-xs text-gray-500 mt-1">Status: {listing.approved ? "Approved" : "Pending"} {listing.sold && "| Sold"}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => startEdit(listing)} className="text-blue-600"><Edit2 size={18} /></button>
                      <button onClick={() => confirm("Delete Listing", "Are you sure you want to delete this property?", () => deleteListing(listing.id))} className="text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map(listing => {
                const { icon: Icon, color } = getListingTypeIcon(listing.listingType);
                return (
                  <div key={listing.id} className="border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition">
                    {listing.images?.[0] && <img src={listing.images[0]} alt="Property" className="w-full sm:w-48 h-32 object-cover rounded-lg" />}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={color} />
                          <h3 className="font-bold text-lg">{listing.address}</h3>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setPreviewListing(listing)} className="text-blue-600"><Eye size={18} /></button>
                          <button onClick={() => startEdit(listing)} className="text-blue-600"><Edit2 size={18} /></button>
                          <button onClick={() => confirm("Delete Listing", "Are you sure?", () => deleteListing(listing.id))} className="text-red-600"><Trash2 size={18} /></button>
                        </div>
                      </div>
                      <p className="text-green-700 font-semibold mt-1">KSh {listing.price?.toLocaleString()} {listing.pricePeriod === "per_month" ? "/month" : listing.pricePeriod === "per_night" ? "/night" : ""}</p>
                      {listing.listingType === "rental" && listing.securityDeposit > 0 && (
                        <p className="text-xs text-gray-500">Deposit: KSh {listing.securityDeposit?.toLocaleString()}</p>
                      )}
                      {listing.listingType === "airbnb" && listing.cleaningFee > 0 && (
                        <p className="text-xs text-gray-500">Cleaning fee: KSh {listing.cleaningFee?.toLocaleString()}</p>
                      )}
                      <p className="text-sm text-gray-600">{listing.bedrooms} beds / {listing.bathrooms} baths</p>
                      <p className="text-xs text-gray-500 mt-1">Status: {listing.approved ? "Approved" : "Pending"} {listing.sold && "| Sold"}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Property Details</h3>
              <button onClick={() => setPreviewListing(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4">
              {/* Image gallery */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {previewListing.images?.map((img, idx) => (
                  <img key={idx} src={img} alt={`Room ${idx+1}`} className="w-full h-32 object-cover rounded-lg" />
                ))}
                {(!previewListing.images || previewListing.images.length === 0) && (
                  <div className="col-span-full text-center text-gray-500">No images uploaded</div>
                )}
              </div>
              <h4 className="text-lg font-semibold">{previewListing.address}</h4>
              <p className="text-green-700 font-bold">KSh {previewListing.price?.toLocaleString()} {previewListing.pricePeriod === "per_month" ? "/month" : previewListing.pricePeriod === "per_night" ? "/night" : ""}</p>
              {previewListing.listingType === "rental" && previewListing.securityDeposit > 0 && (
                <p className="text-sm text-gray-600">Security Deposit: KSh {previewListing.securityDeposit?.toLocaleString()}</p>
              )}
              {previewListing.listingType === "airbnb" && previewListing.cleaningFee > 0 && (
                <p className="text-sm text-gray-600">Cleaning Fee: KSh {previewListing.cleaningFee?.toLocaleString()}</p>
              )}
              <p className="text-sm text-gray-600">{previewListing.bedrooms} beds / {previewListing.bathrooms} baths</p>
              <p className="text-sm text-gray-500 mt-2">{previewListing.description}</p>
              <p className="text-xs text-gray-400 mt-2">Listing Type: {previewListing.listingType === "sale" ? "For Sale" : previewListing.listingType === "rental" ? "For Rent" : "Airbnb"}</p>
              <p className="text-xs text-gray-400">Agent: {previewListing.agentName}</p>
              <p className="text-xs text-gray-400">Approved: {previewListing.approved ? "Yes" : "No"}</p>
              <p className="text-xs text-gray-400">Sold: {previewListing.sold ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}