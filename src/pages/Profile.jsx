/**
 * Profile – User profile management page
 * 
 * Allows authenticated users to view and edit their profile information:
 * - Name and bio (description)
 * - Role (read‑only)
 * - Email (read‑only)
 * - Delete account (with confirmation modal)
 * 
 * Uses Firestore to store user data, Firebase Auth for account deletion,
 * and custom notification hooks (useConfirm, useToast) for user feedback.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, logoutUser } from "../firebase";
import { doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import Navbar from "../components/Navbar";
import { UserCircle, Save, Trash2, Edit2, X } from "lucide-react";
import { useConfirm, useToast } from "../components/NotificationManager";

export default function Profile() {
  // --- State variables ---
  const [role, setRole] = useState(null);               // User's role (buyer/agent/admin)
  const [userName, setUserName] = useState("");         // Display name
  const [userDescription, setUserDescription] = useState(""); // Bio text
  const [userAvatar, setUserAvatar] = useState("");     // Avatar URL (future Cloudinary integration)
  const [isEditing, setIsEditing] = useState(false);    // Toggle edit mode
  const [editName, setEditName] = useState("");         // Temporary name while editing
  const [editDescription, setEditDescription] = useState(""); // Temporary bio while editing
  const [error, setError] = useState("");               // Error message to display
  const [loading, setLoading] = useState(true);         // Loading state while fetching profile
  const navigate = useNavigate();
  const confirm = useConfirm(); // Confirmation modal hook
  const toast = useToast();     // Toast notification hook

  // --- Load user profile from Firestore when component mounts ---
  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return; // No logged‑in user – should not happen because route is protected
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || "");
          setUserDescription(data.description || "");
          setUserAvatar(data.avatar || "");
          setRole(data.role);
          setEditName(data.name || "");
          setEditDescription(data.description || "");
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []); // Empty dependency array → runs once when component mounts

  // --- Save edited profile to Firestore ---
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setError("");
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          name: editName,
          description: editDescription,
        });
        setUserName(editName);
        setUserDescription(editDescription);
        localStorage.setItem("userName", editName); // Update cached name for navbar
        setIsEditing(false);
        toast("Profile updated successfully"); // Success toast
      }
    } catch (err) {
      setError("Failed to save changes");
    }
  };

  // --- Delete account (Firestore + Auth) with confirmation ---
  const handleDeleteAccount = () => {
    confirm(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            // 1. Delete Firestore document
            await deleteDoc(doc(db, "users", user.uid));
            // 2. Delete Firebase Auth user
            await deleteUser(user);
            // 3. Log out
            await logoutUser();
            // 4. Redirect to auth page
            navigate("/auth");
            toast("Account deleted successfully");
          }
        } catch (err) {
          setError("Failed to delete account. You may need to re-authenticate.");
        }
      }
    );
  };

  // --- Show loading indicator while fetching profile ---
  if (loading) return <div>Loading profile...</div>;

  // --- Render the profile UI ---
  return (
    <div>
      {/* Persistent navbar (role is passed to show correct links) */}
      <Navbar role={role} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-green-100 mt-1">Manage your personal information</p>
          </div>
          <div className="p-6 md:p-8">
            {/* Error message display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section (future Cloudinary integration placeholder) */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="w-36 h-36 rounded-full object-cover border-4 border-green-200 shadow-md"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center border-4 border-green-200">
                      <UserCircle size={80} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">Profile picture upload coming soon</p>
              </div>

              {/* Info Section (edit mode vs view mode) */}
              <div className="flex-1 space-y-5">
                {isEditing ? (
                  // --- Edit mode ---
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows="4"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Tell others about yourself..."
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition"
                      >
                        <Save size={18} /> Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(userName);
                          setEditDescription(userDescription);
                          setError("");
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg flex items-center gap-2 transition"
                      >
                        <X size={18} /> Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  // --- View mode ---
                  <>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Name</label>
                      <p className="text-xl font-semibold text-gray-800 mt-1">{userName || "Not set"}</p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                      <p className="text-gray-800 mt-1">{auth.currentUser?.email}</p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Role</label>
                      <p className="text-gray-800 mt-1 capitalize">{role}</p>
                    </div>
                    <div className="pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Bio</label>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{userDescription || "No bio yet. Click edit to add one."}</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <Edit2 size={18} /> Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Danger Zone – Account deletion */}
            <div className="mt-10 pt-6 border-t-2 border-red-100">
              <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                <Trash2 size={18} /> Danger Zone
              </h3>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Trash2 size={18} /> Delete Account
              </button>
              <p className="text-xs text-gray-500 mt-2">This will permanently remove your account and all associated data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}