function QRCodeModal({ classData, session, date, onCancel }) {
  try {
    const qrValue = JSON.stringify({
      classId: classData.id,
      className: classData.name,
      session: session,
      date: date,
      type: 'attendance_token'
    });

    // In a real production app, we would use a QR code library.
    // Since we are restricted to specific CDNs, we'll use a public API to generate the QR image.
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="qr-code-modal" data-file="components/QRCodeModal.js">
        <div className="card max-w-sm w-full text-center">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Session QR Code</h2>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-inner mb-4 flex justify-center">
            <img src={qrImageUrl} alt="Session QR Code" className="w-64 h-64" />
          </div>
          
          <div className="space-y-2 mb-6">
            <p className="font-semibold text-lg text-[var(--text-primary)]">{classData.name}</p>
            <p className="text-[var(--text-secondary)]">Session: {session} | Date: {new Date(date).toLocaleDateString()}</p>
            <p className="text-xs text-[var(--text-secondary)] bg-gray-100 p-2 rounded">
              Students can scan this code to mark themselves present automatically.
            </p>
          </div>
          
          <button onClick={onCancel} className="btn btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('QRCodeModal component error:', error);
    return null;
  }
}