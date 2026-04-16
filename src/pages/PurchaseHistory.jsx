/**
 * PurchaseHistory – Buyer's purchase history
 * 
 * Displays all properties that the current buyer has successfully purchased.
 * Shows each transaction with property image (if available), address, amount paid,
 * date, and the phone number used during payment.
 * Accessible only to buyers (route protection in App.jsx).
 */

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

export default function PurchaseHistory() {
  // --- State variables ---
  const [transactions, setTransactions] = useState([]); // List of completed purchases
  const [loading, setLoading] = useState(true);         // Loading state while fetching data
  const [role, setRole] = useState(null);               // User's role (used for navbar)

  // --- Fetch buyer's transaction history on component mount ---
  useEffect(() => {
    const fetchPurchases = async () => {
      const user = auth.currentUser;
      if (!user) return; // No logged‑in user – should not happen because route is protected

      // Query Firestore for all transactions where buyerId matches current user's UID
      const q = query(collection(db, "transactions"), where("buyerId", "==", user.uid));
      const snap = await getDocs(q);
      
      // Map Firestore documents to plain objects with id
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      setLoading(false);
    };
    fetchPurchases();
    
    // Get user role from localStorage for the navbar
    setRole(localStorage.getItem("userRole"));
  }, []); // Empty dependency array → runs once when component mounts

  // --- Show loading indicator while fetching data ---
  if (loading) return <div>Loading purchase history...</div>;

  // --- Render the purchase history UI ---
  return (
    <div>
      {/* Persistent navbar (role is passed to show correct links) */}
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          {/* Page title */}
          <h2 className="text-2xl font-bold text-green-800 mb-4">My Purchase History</h2>
          
          {/* Conditional rendering: empty state vs list of transactions */}
          {transactions.length === 0 ? (
            <p className="text-gray-500">You haven't purchased any property yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map(t => (
                <div key={t.id} className="border rounded-lg p-4 flex gap-4">
                  {/* Property image (first image stored during payment) */}
                  {t.houseImage && (
                    <img src={t.houseImage} alt="Property" className="w-32 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p><strong>Property:</strong> {t.houseAddress}</p>
                    <p><strong>Amount Paid:</strong> KSh {t.amount?.toLocaleString()}</p>
                    <p><strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}</p>
                    <p><strong>Phone:</strong> {t.buyerPhone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}