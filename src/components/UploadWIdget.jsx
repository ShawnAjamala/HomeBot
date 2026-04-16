import { useRef, useEffect } from 'react';

/**
 * UploadWidget Component
 * 
 * A reusable button that opens Cloudinary's upload widget.
 * Allows users to upload images directly to Cloudinary using an unsigned preset.
 * 
 * @param {string} cloudName - Your Cloudinary cloud name (from dashboard)
 * @param {string} uploadPreset - Unsigned upload preset name (created in Cloudinary settings)
 * @param {function} onUpload - Callback function that receives the uploaded image URL
 * @param {string} buttonText - Text displayed on the button (default: "Upload Image")
 * @param {boolean} multiple - Whether to allow multiple image uploads (default: false)
 */
const UploadWidget = ({ cloudName, uploadPreset, onUpload, buttonText = "Upload Image", multiple = false }) => {
  // Reference to the Cloudinary widget instance (persists across re-renders)
  const widgetRef = useRef(null);

  // Cleanup: destroy the widget when the component unmounts
  useEffect(() => {
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy(); // Prevents memory leaks
        widgetRef.current = null;
      }
    };
  }, []);

  const openWidget = () => {
    // Check if the Cloudinary widget script has loaded (from index.html)
    if (!window.cloudinary) {
      alert("Upload widget not loaded. Please refresh the page.");
      return;
    }

    // If widget already exists, just open it (avoids re‑creating)
    if (widgetRef.current) {
      widgetRef.current.open();
      return;
    }

    // Create a new widget instance
    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        multiple: multiple,
        cropping: !multiple,     // Enable cropping only for single images
        croppingAspectRatio: 1,  // Square crop for profile pictures
        showAdvancedOptions: false,
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          return;
        }
        // When upload completes successfully, call the parent's callback with the image URL
        if (result && result.event === 'success') {
          onUpload(result.info.secure_url);
        }
      }
    );
    widgetRef.current.open();
  };

  return (
    <button
      onClick={openWidget}
      type="button"
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      {buttonText}
    </button>
  );
};

export default UploadWidget;