/**
 * FinanceHistory – Agent's earnings history
 * 
 * Displays all transactions where the current agent is the seller.
 * Shows each sale's property address, sold price, agent's 95% earnings,
 * buyer name, and date. Also displays total earnings sum.
 * Accessible only to agents (route protection in App.jsx).
 */

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

export default function FinanceHistory() {
  // --- State variables ---
  const [transactions, setTransactions] = useState([]); // List of payment transactions
  const [totalEarnings, setTotalEarnings] = useState(0); // Sum of agentEarnings (95% of each sale)
  const [loading, setLoading] = useState(true);         // Loading state while fetching data
  const [role, setRole] = useState(null);               // User's role (used for navbar)

  // --- Fetch agent's transaction history on component mount ---
  useEffect(() => {
    const fetchEarnings = async () => {
      const user = auth.currentUser;
      if (!user) return; // No logged‑in user – should not happen because route is protected

      // Query Firestore for all transactions where agentId matches current user's UID
      const q = query(collection(db, "transactions"), where("agentId", "==", user.uid));
      const snap = await getDocs(q);
      
      // Map Firestore documents to plain objects
      const txns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txns);
      
      // Calculate total earnings (95% commission from each sale)
      const total = txns.reduce((sum, t) => sum + (t.agentEarnings || 0), 0);
      setTotalEarnings(total);
      
      setLoading(false);
    };
    fetchEarnings();
    
    // Get user role from localStorage for the navbar
    setRole(localStorage.getItem("userRole"));
  }, []); // Empty dependency array → runs once when component mounts

  // --- Show loading indicator while fetching data ---
  if (loading) return <div>Loading finance history...</div>;

  // --- Render the finance history UI ---
  return (
    <div>
      {/* Persistent navbar (role is passed to show correct links) */}
      <Navbar role={role} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100">
          {/* Page title */}
          <h2 className="text-2xl font-bold text-green-800 mb-4">My Finance History</h2>
          
          {/* Total earnings summary card */}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-lg font-semibold">Total Earnings (95% of sales)</p>
            <p className="text-3xl font-bold text-green-700">KSh {totalEarnings.toLocaleString()}</p>
          </div>
          
          {/* List of individual transactions */}
          {transactions.length === 0 ? (
            <p className="text-gray-500">No sales yet.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map(t => (
                <div key={t.id} className="border rounded-lg p-4">
                  <p><strong>Property:</strong> {t.houseAddress}</p>
                  <p><strong>Sold Price:</strong> KSh {t.amount?.toLocaleString()}</p>
                  <p><strong>Your Earnings (95%):</strong> KSh {t.agentEarnings?.toLocaleString()}</p>
                  <p><strong>Buyer:</strong> {t.buyerName}</p>
                  <p><strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}