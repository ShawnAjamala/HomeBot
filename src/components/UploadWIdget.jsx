import { useRef, useEffect } from 'react';

const UploadWidget = ({ cloudName, uploadPreset, onUpload, buttonText = "Upload Image" }) => {
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
    if (widgetRef.current) {
      widgetRef.current.open();
      return;
    }

    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        multiple: false,
        cropping: true,
        croppingAspectRatio: 1,
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          onUpload(result.info.secure_url);
        }
      }
    );
    widgetRef.current.open();
  };

  return (
    <button
      onClick={openWidget}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
    >
      {buttonText}
    </button>
  );
};

export default UploadWidget;