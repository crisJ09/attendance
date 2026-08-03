function QRScanner({ onScanSuccess, onCancel }) {
  try {
    const scannerRef = React.useRef(null);
    const [scanError, setScanError] = React.useState('');

    React.useEffect(() => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if ((data.type === 'attendance_token' || data.type === 'join_token') && data.classId) {
            html5QrCode.stop().then(() => {
              onScanSuccess(data);
            }).catch(err => {
              console.error("Error stopping scanner:", err);
              onScanSuccess(data);
            });
          } else {
            setScanError("Invalid QR code format for this system.");
          }
        } catch (e) {
          setScanError("Could not read QR code data.");
        }
      };

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback
      ).catch(err => {
        console.error("Error starting scanner:", err);
        setScanError("Unable to access camera. Please check permissions.");
      });

      return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(err => console.error("Error cleaning up scanner:", err));
        }
      };
    }, []);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4" data-name="qr-scanner-modal" data-file="components/QRScanner.js">
        <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold text-gray-800">Scan QR Code</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 p-1">
              <div className="icon-x text-2xl"></div>
            </button>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg bg-black min-h-[300px]"></div>
            
            {scanError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                <div className="icon-circle-alert text-lg mt-0.5"></div>
                <span>{scanError}</span>
              </div>
            )}
            
            <p className="mt-4 text-center text-sm text-gray-500">
              Point your camera at the teacher's screen to scan the QR code.
            </p>
          </div>
          
          <div className="p-4 bg-white border-t border-gray-100">
            <button onClick={onCancel} className="btn btn-secondary w-full">
              Cancel Scanning
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('QRScanner component error:', error);
    return null;
  }
}