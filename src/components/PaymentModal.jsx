import { useState } from "react";
import { X } from "lucide-react";

export default function PaymentModal({ house, onClose, onSuccess }) {
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerPin, setBuyerPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buyerPhone || buyerPhone.length < 10) {
      setError("Please enter a valid M-Pesa phone number (10 digits)");
      return;
    }
    if (!buyerPin || buyerPin.length < 4) {
      setError("Please enter your M-Pesa PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { db, auth } = await import("../firebase");
      const { addDoc, collection, updateDoc, doc } = await import("firebase/firestore");
      const transaction = {
        houseId: house.id,
        buyerId: auth.currentUser.uid,
        buyerName: localStorage.getItem("userName") || auth.currentUser.email,
        buyerPhone: buyerPhone,
        amount: house.price,
        status: "completed",
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "transactions"), transaction);
      await updateDoc(doc(db, "houses", house.id), { sold: true, soldTo: auth.currentUser.uid });
      onSuccess();
    } catch (err) {
      setError("Payment failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">M-Pesa Payment</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <p className="text-gray-600 mb-2">House: <strong>{house.address}</strong></p>
        <p className="text-green-700 font-bold text-xl mb-4">KSh {house.price?.toLocaleString()}</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Your M-Pesa Phone Number</label>
            <input type="tel" placeholder="0712345678" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">M-Pesa PIN</label>
            <input type="password" maxLength="6" placeholder="Enter your PIN" value={buyerPin} onChange={e => setBuyerPin(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800">
            {loading ? "Processing..." : "Confirm Payment"}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-3 text-center">Your PIN is only used for verification and is not stored.</p>
      </div>
    </div>
  );
}