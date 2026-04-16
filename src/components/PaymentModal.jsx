import { useState } from "react";
import { X } from "lucide-react";

/**
 * PaymentModal Component
 * 
 * This modal appears when a buyer clicks "Buy Now" on a property.
 * It collects the buyer's M-Pesa phone number and PIN (simulated),
 * processes the payment by creating a transaction document in Firestore,
 * and marks the house as sold.
 * 
 * @param {Object} house - The property being purchased (address, price, images, agentId, etc.)
 * @param {Function} onClose - Closes the modal without purchasing
 * @param {Function} onSuccess - Called after successful payment (refreshes buyer dashboard)
 */
export default function PaymentModal({ house, onClose, onSuccess }) {
  // State for form inputs and UI feedback
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerPin, setBuyerPin] = useState("");
  const [error, setError] = useState("");      // Error message to display
  const [loading, setLoading] = useState(false); // Disables button during processing

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Validation ---
    // M-Pesa phone numbers in Kenya are 10 digits (e.g., 0712345678)
    if (!buyerPhone || buyerPhone.length < 10) {
      setError("Please enter a valid M-Pesa phone number (10 digits)");
      return;
    }
    // PIN should be at least 4 digits (simulated – not stored in real system)
    if (!buyerPin || buyerPin.length < 4) {
      setError("Please enter your M-Pesa PIN");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Dynamically import Firebase modules to reduce initial bundle size
      const { db, auth } = await import("../firebase");
      const { addDoc, collection, updateDoc, doc } = await import("firebase/firestore");
      
      // Calculate commission split: 5% to admin, 95% to agent
      const adminProfit = house.price * 0.05;
      const agentEarnings = house.price * 0.95;

      // Transaction object to be saved in Firestore 'transactions' collection
      const transaction = {
        houseId: house.id,                    // Reference to the sold property
        houseAddress: house.address,          // Denormalized for easy display
        houseImage: house.images?.[0] || null, // First image for purchase history
        buyerId: auth.currentUser.uid,        // Firebase Auth UID
        buyerName: localStorage.getItem("userName") || auth.currentUser.email,
        buyerPhone: buyerPhone,               // User's entered phone number
        amount: house.price,
        adminProfit: adminProfit,             // 5% commission for admin
        agentEarnings: agentEarnings,         // 95% earnings for agent
        agentId: house.agentId,
        agentName: house.agentName,
        status: "completed",
        createdAt: new Date().toISOString()
      };

      // 1. Save transaction record
      await addDoc(collection(db, "transactions"), transaction);
      
      // 2. Mark the house as sold (prevents other buyers from seeing/purchasing it)
      await updateDoc(doc(db, "houses", house.id), { 
        sold: true, 
        soldTo: auth.currentUser.uid 
      });
      
      // 3. Close modal and notify parent (BuyerDashboard) to refresh listings
      onSuccess();
    } catch (err) {
      // Generic error message for demo – in production you might log the actual error
      setError("Payment failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Full-screen overlay with semi‑transparent background
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal card */}
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">M-Pesa Payment</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        {/* Property info (read‑only) */}
        <p className="text-gray-600 mb-2">House: <strong>{house.address}</strong></p>
        <p className="text-green-700 font-bold text-xl mb-4">KSh {house.price?.toLocaleString()}</p>

        {/* Payment form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Your M-Pesa Phone Number</label>
            <input
              type="tel"
              placeholder="0712345678"
              value={buyerPhone}
              onChange={e => setBuyerPhone(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">M-Pesa PIN</label>
            <input
              type="password"
              maxLength="6"
              placeholder="Enter your PIN"
              value={buyerPin}
              onChange={e => setBuyerPin(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Error display area */}
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          {/* Submit button – disabled while processing */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800"
          >
            {loading ? "Processing..." : "Confirm Payment"}
          </button>
        </form>

        {/* Note about PIN security (user‑facing) */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          Your PIN is only used for verification and is not stored.
        </p>
      </div>
    </div>
  );
}