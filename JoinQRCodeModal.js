function JoinQRCodeModal({ classData, onCancel }) {
  try {
    const qrValue = JSON.stringify({
      classId: classData.id,
      className: classData.name,
      joinCode: classData.joinCode,
      type: 'join_token'
    });

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-name="join-qr-modal" data-file="components/JoinQRCodeModal.js">
        <div className="card max-w-sm w-full text-center">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Class Join QR Code</h2>
            <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <div className="icon-x text-xl"></div>
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-inner mb-4 flex justify-center border-4 border-indigo-100">
            <img src={qrImageUrl} alt="Join QR Code" className="w-64 h-64" />
          </div>
          
          <div className="space-y-2 mb-6">
            <p className="font-semibold text-lg text-[var(--text-primary)]">{classData.name}</p>
            <p className="text-indigo-600 font-bold text-xl tracking-widest">{classData.joinCode}</p>
            <p className="text-xs text-[var(--text-secondary)] bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              Students can scan this code from their "Scan QR Code" button to join this class instantly.
            </p>
          </div>
          
          <button onClick={onCancel} className="btn btn-primary w-full bg-indigo-600 hover:bg-indigo-700">
            Done
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('JoinQRCodeModal component error:', error);
    return null;
  }
}