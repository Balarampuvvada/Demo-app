import { useState, useEffect, useRef, memo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScan, onError }) => {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const containerId = useRef(`qr-reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const startScanning = async () => {
    try {
      setScanning(true);
      
      // Clean up any existing scanner
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      
      html5QrCodeRef.current = new Html5Qrcode(containerId.current);
      
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Silent error handling
        }
      );
    } catch (err) {
      console.error('QR Scanner error:', err);
      onError?.(err.message);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  // Stop scanning when component unmounts or when scanning is turned off
  useEffect(() => {
    if (!scanning && html5QrCodeRef.current) {
      stopScanning();
    }
  }, [scanning]);

  return (
    <div className="space-y-4">
      <div
        id={containerId.current}
        className={`${scanning ? 'block' : 'hidden'} mx-auto max-w-md`}
      />
      
      <div className="flex justify-center">
        {!scanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start QR Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(QRScanner);
