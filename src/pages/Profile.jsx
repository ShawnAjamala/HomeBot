import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import UploadWidget from "../components/UploadWIdget";
import { UserCircle, Save, Trash2, Edit2, X } from "lucide-react";

export default function Profile() {
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(data.name || "");
          setUserBio(data.description || "");
          setUserAvatar(data.avatar || "");
          setRole(data.role);
          setEditName(data.name || "");
          setEditBio(data.description || "");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleImageUpload = async (imageUrl) => {
    setUserAvatar(imageUrl);
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { avatar: imageUrl });
      localStorage.setItem("userAvatar", imageUrl);
    }
  };

  const handleDeleteAvatar = async () => {
    if (window.confirm("Remove your profile picture?")) {
      setUserAvatar("");
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), { avatar: "" });
        localStorage.removeItem("userAvatar");
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          name: editName,
          description: editBio,
        });
        setUserName(editName);
        setUserBio(editBio);
        localStorage.setItem("userName", editName);
        setIsEditing(false);
      }
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center mt-20">Loading profile...</div>;

  return (
    <div>
      <Navbar role={role} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-green-100 mt-1">Manage your personal information</p>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section */}
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

                <div className="flex gap-2">
                  <UploadWidget
                    cloudName="dqxemsd9j"
                    uploadPreset="homebot_123"
                    onUpload={handleImageUpload}
                    buttonText="Change Photo"
                  />
                  {userAvatar && (
                    <button
                      onClick={handleDeleteAvatar}
                      className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">Upload a square image for best results</p>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-5">
                {isEditing ? (
                  // Edit mode
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Description</label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows="4"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Tell others about yourself..."
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition"
                      >
                        <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(userName);
                          setEditBio(userBio);
                          setError("");
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg flex items-center gap-2 transition"
                      >
                        <X size={18} /> Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  // View mode
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
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{userBio || "No bio yet. Click edit to add one."}</p>
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

            {/* Danger Zone */}
            <div className="mt-10 pt-6 border-t-2 border-red-100">
              <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                <Trash2 size={18} /> Danger Zone
              </h3>
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to delete your account? This action is permanent.")) {
                    try {
                      const user = auth.currentUser;
                      if (user) {
                        await deleteDoc(doc(db, "users", user.uid));
                        await user.delete();
                        await logoutUser();
                        navigate("/auth");
                      }
                    } catch (err) {
                      setError("Failed to delete account. You may need to re-authenticate.");
                    }
                  }
                }}
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