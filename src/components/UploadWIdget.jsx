import { useRef, useEffect } from 'react';

const UploadWidget = ({ cloudName, uploadPreset, onUpload, buttonText = "Upload Image", multiple = false }) => {
  const widgetRef = useRef(null);

  useEffect(() => {
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
    };
  }, []);

  const openWidget = () => {
    if (!window.cloudinary) {
      alert("Upload widget not loaded. Please refresh the page.");
      return;
    }

    if (widgetRef.current) {
      widgetRef.current.open();
      return;
    }

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        multiple: multiple,
        cropping: !multiple, // only crop single images
        croppingAspectRatio: 1,
        showAdvancedOptions: false,
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          return;
        }
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