/**
 * ManageProperties – Admin panel for all properties
 * 
 * Features:
 * - Grid / List view toggle (saved to localStorage)
 * - Filters: approval status, listing type, sold status
 * - Preview modal (eye icon) to view full image and description
 * - Approve, disapprove (with confirmation), delete actions
 * - Uses inline custom hooks for data management
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Check, X, Trash2, Eye, Grid3x3, List, Filter } from "lucide-react";
import Navbar from "../components/Navbar";
import { useConfirm, useToast } from "../components/NotificationManager";

// ==================== Custom Hooks (inline) ====================

/**
 * useProperties – Fetch all properties from Firestore
 * Returns { properties, loading, error, refetch, approve, disapprove, deleteProperty }
 */
const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "houses"));
      setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const approve = useCallback(async (propId) => {
    await updateDoc(doc(db, "houses", propId), { approved: true });
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, approved: true } : p));
    toast("Property approved");
  }, [toast]);

  const disapprove = useCallback(async (propId) => {
    await updateDoc(doc(db, "houses", propId), { approved: false });
    setProperties(prev => prev.map(p => p.id === propId ? { ...p, approved: false } : p));
    toast("Property disapproved and hidden from buyers");
  }, [toast]);

  const deleteProperty = useCallback(async (propId) => {
    await deleteDoc(doc(db, "houses", propId));
    setProperties(prev => prev.filter(p => p.id !== propId));
    toast("Property deleted");
  }, [toast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, loading, error, refetch: fetchProperties, approve, disapprove, deleteProperty };
};

/**
 * useLayoutPreference – Save and retrieve user's preferred layout (grid/list)
 */
const useLayoutPreference = () => {
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem("manage_properties_layout") || "grid";
  });

  const updateLayout = useCallback((newLayout) => {
    setLayout(newLayout);
    localStorage.setItem("manage_properties_layout", newLayout);
  }, []);

  return { layout, setLayout: updateLayout };
};

/**
 * usePropertyFilters – Manage filter state and filtered properties
 */
const usePropertyFilters = (properties) => {
  const [filters, setFilters] = useState({
    approval: "all", // all, approved, pending
    listingType: "all", // all, sale, rental, airbnb
    sold: "all", // all, yes, no
  });

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      if (filters.approval === "approved" && !prop.approved) return false;
      if (filters.approval === "pending" && prop.approved) return false;
      if (filters.listingType !== "all" && prop.listingType !== filters.listingType) return false;
      if (filters.sold === "yes" && !prop.sold) return false;
      if (filters.sold === "no" && prop.sold) return false;
      return true;
    });
  }, [properties, filters]);

  return { filters, setFilters, filteredProperties };
};

// ==================== Main Component ====================

export default function ManageProperties() {
  const [role, setRole] = useState(null);
  const [previewProperty, setPreviewProperty] = useState(null);
  const { properties, loading, error, approve, disapprove, deleteProperty } = useProperties();
  const { layout, setLayout } = useLayoutPreference();
  const { filters, setFilters, filteredProperties } = usePropertyFilters(properties);
  const confirm = useConfirm();
  const toast = useToast();

  useEffect(() => {
    setRole(localStorage.getItem("userRole"));
  }, []);

  if (loading) return <div>Loading properties...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold text-green-800">Manage Properties</h2>
            <div className="flex gap-2">
              <button onClick={() => setLayout("grid")} className={`p-2 rounded-md ${layout === "grid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`} title="Grid view"><Grid3x3 size={20} /></button>
              <button onClick={() => setLayout("list")} className={`p-2 rounded-md ${layout === "list" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`} title="List view"><List size={20} /></button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-3"><Filter size={18} className="text-gray-600" /><span className="font-medium">Filters</span></div>
            <div className="flex flex-wrap gap-4">
              <select value={filters.approval} onChange={e => setFilters(prev => ({ ...prev, approval: e.target.value }))} className="p-2 border rounded-md text-sm">
                <option value="all">All Approval Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
              <select value={filters.listingType} onChange={e => setFilters(prev => ({ ...prev, listingType: e.target.value }))} className="p-2 border rounded-md text-sm">
                <option value="all">All Types</option>
                <option value="sale">For Sale</option>
                <option value="rental">For Rent</option>
                <option value="airbnb">Airbnb</option>
              </select>
              <select value={filters.sold} onChange={e => setFilters(prev => ({ ...prev, sold: e.target.value }))} className="p-2 border rounded-md text-sm">
                <option value="all">Sold Status (All)</option>
                <option value="yes">Sold</option>
                <option value="no">Not Sold</option>
              </select>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <p className="text-gray-500">No properties match the filters.</p>
          ) : layout === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map(prop => (
                <div key={prop.id} className="border border-green-200 rounded-lg p-4 hover:shadow-md transition">
                  {prop.images?.[0] && <img src={prop.images[0]} alt={prop.address} className="w-full h-40 object-cover rounded-lg mb-2" />}
                  <h3 className="font-bold text-lg">{prop.address}</h3>
                  <p className="text-green-700 font-semibold">KSh {prop.price?.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{prop.bedrooms} beds / {prop.bathrooms} baths</p>
                  <p className="text-xs text-gray-500 mt-1">Type: {prop.listingType === "sale" ? "Sale" : prop.listingType === "rental" ? "Rent" : "Airbnb"}</p>
                  <p className="text-xs text-gray-500">Status: {prop.approved ? "Approved" : "Pending"} {prop.sold && "| Sold"}</p>
                  <div className="flex justify-between items-center mt-3">
                    <button onClick={() => setPreviewProperty(prop)} className="text-blue-600" title="Preview"><Eye size={18} /></button>
                    <div className="flex gap-2">
                      {!prop.approved ? (
                        <button onClick={() => approve(prop.id)} className="text-green-600" title="Approve"><Check size={18} /></button>
                      ) : (
                        <button onClick={() => confirm("Disapprove Property", "This property will be hidden from buyers. Are you sure?", () => disapprove(prop.id))} className="text-yellow-600" title="Disapprove"><X size={18} /></button>
                      )}
                      <button onClick={() => confirm("Delete Property", "Are you sure you want to delete this property?", () => deleteProperty(prop.id))} className="text-red-600" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map(prop => (
                <div key={prop.id} className="border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition">
                  {prop.images?.[0] && <img src={prop.images[0]} alt={prop.address} className="w-full sm:w-48 h-32 object-cover rounded-lg" />}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{prop.address}</h3>
                        <p className="text-xs text-gray-500 mt-1">Type: {prop.listingType === "sale" ? "Sale" : prop.listingType === "rental" ? "Rent" : "Airbnb"} | Status: {prop.approved ? "Approved" : "Pending"} {prop.sold && "| Sold"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPreviewProperty(prop)} className="text-blue-600"><Eye size={18} /></button>
                        {!prop.approved ? (
                          <button onClick={() => approve(prop.id)} className="text-green-600"><Check size={18} /></button>
                        ) : (
                          <button onClick={() => confirm("Disapprove Property", "This property will be hidden from buyers. Are you sure?", () => disapprove(prop.id))} className="text-yellow-600"><X size={18} /></button>
                        )}
                        <button onClick={() => confirm("Delete Property", "Are you sure you want to delete this property?", () => deleteProperty(prop.id))} className="text-red-600"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <p className="text-green-700 font-semibold mt-1">KSh {prop.price?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{prop.bedrooms} beds / {prop.bathrooms} baths</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{prop.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Agent: {prop.agentName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Property Details</h3>
              <button onClick={() => setPreviewProperty(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4">
              {previewProperty.images?.[0] && <img src={previewProperty.images[0]} alt={previewProperty.address} className="w-full h-64 object-cover rounded-lg mb-4" />}
              <h4 className="text-lg font-semibold">{previewProperty.address}</h4>
              <p className="text-green-700 font-bold">KSh {previewProperty.price?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{previewProperty.bedrooms} beds / {previewProperty.bathrooms} baths</p>
              <p className="text-sm text-gray-500 mt-2">{previewProperty.description}</p>
              <p className="text-xs text-gray-400 mt-2">Agent: {previewProperty.agentName}</p>
              <p className="text-xs text-gray-400">Listing Type: {previewProperty.listingType === "sale" ? "For Sale" : previewProperty.listingType === "rental" ? "For Rent" : "Airbnb"}</p>
              <p className="text-xs text-gray-400">Approved: {previewProperty.approved ? "Yes" : "No"}</p>
              <p className="text-xs text-gray-400">Sold: {previewProperty.sold ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}