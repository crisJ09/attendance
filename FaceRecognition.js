function FaceRecognition({ mode = 'scan', studentId, onSuccess, onCancel }) {
    try {
        const videoRef = React.useRef(null);
        const canvasRef = React.useRef(null);
        const [isModelLoaded, setIsModelLoaded] = React.useState(false);
        const [statusMessage, setStatusMessage] = React.useState('Loading face detection models...');
        const [isProcessing, setIsProcessing] = React.useState(false);
        const [registrationStep, setRegistrationStep] = React.useState(0);
        const [capturedDescriptors, setCapturedDescriptors] = React.useState([]);

        const steps = [
            { label: 'Look Straight', icon: 'user' },
            { label: 'Tilt Left', icon: 'chevron-left' },
            { label: 'Tilt Right', icon: 'chevron-right' },
            { label: 'Look Up', icon: 'chevron-up' },
            { label: 'Look Down', icon: 'chevron-down' }
        ];

        React.useEffect(() => {
            const loadModels = async () => {
                try {
                    // Use CDN for models
                    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                    ]);
                    setIsModelLoaded(true);
                    setStatusMessage(mode === 'register' ? 'Position your face in the center' : 'Looking for your face...');
                    startVideo();
                } catch (error) {
                    console.error('Error loading face-api models:', error);
                    setStatusMessage('Error loading biometric models. Check internet connection.');
                }
            };
            loadModels();

            return () => {
                if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                }
            };
        }, []);

        const startVideo = () => {
            navigator.mediaDevices.getUserMedia({ video: {} })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    setStatusMessage("Camera access denied. Please allow camera permissions.");
                });
        };

        const handleProcess = async () => {
            if (!isModelLoaded || !videoRef.current || isProcessing) return;

            setIsProcessing(true);
            setStatusMessage(mode === 'register' ? 'Analyzing face...' : 'Verifying identity...');

            try {
                // Using higher quality detection options for better sensitivity
                const options = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512, // Larger input size for better detail detection
                    scoreThreshold: 0.4 // Adjusted threshold for better recognition in varied lighting
                });

                const detection = await faceapi.detectSingleFace(
                    videoRef.current, 
                    options
                ).withFaceLandmarks().withFaceDescriptor();

                if (detection) {
                    if (mode === 'register') {
                        const descriptor = Array.from(detection.descriptor);
                        const newDescriptors = [...capturedDescriptors, descriptor];
                        setCapturedDescriptors(newDescriptors);
                        
                        if (registrationStep < steps.length - 1) {
                            setRegistrationStep(registrationStep + 1);
                            setStatusMessage(`Excellent! Now ${steps[registrationStep + 1].label}`);
                            setIsProcessing(false);
                        } else {
                            // Average the descriptors for better accuracy
                            const averaged = new Float32Array(128);
                            for (let i = 0; i < 128; i++) {
                                let sum = 0;
                                newDescriptors.forEach(d => sum += d[i]);
                                averaged[i] = sum / newDescriptors.length;
                            }
                            onSuccess(Array.from(averaged), true);
                        }
                    } else {
                        // In verification mode, we compare with saved descriptor
                        const savedDescriptorRaw = localStorage.getItem(`face_profile_${studentId}`);
                        if (!savedDescriptorRaw) {
                            setStatusMessage("No registered face profile found. Please register in settings.");
                            setIsProcessing(false);
                            return;
                        }

                        const savedDescriptor = new Float32Array(JSON.parse(savedDescriptorRaw));
                        const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor);

                        // Distance threshold (0.6 is common)
                        if (distance < 0.6) {
                            onSuccess(detection.descriptor, false);
                        } else {
                            setStatusMessage("Identity mismatch. Try again or use QR code.");
                            setIsProcessing(false);
                        }
                    }
                } else {
                    setStatusMessage("No face detected. Ensure good lighting.");
                    setIsProcessing(false);
                }
            } catch (err) {
                console.error("Processing error:", err);
                setStatusMessage("An error occurred during scanning.");
                setIsProcessing(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[110] p-4" data-name="face-recognition-modal" data-file="components/FaceRecognition.js">
                <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="icon-scan text-[var(--primary-color)] text-2xl"></div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {mode === 'register' ? 'Register Face ID' : 'Face Attendance'}
                            </h2>
                        </div>
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <div className="icon-x text-2xl"></div>
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        {mode === 'register' && (
                            <div className="flex justify-between items-center mb-4">
                                {steps.map((s, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${idx <= registrationStep ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            {idx < registrationStep ? <div className="icon-check"></div> : idx + 1}
                                        </div>
                                        <div className={`icon-${s.icon} text-xs ${idx === registrationStep ? 'text-blue-600 animate-bounce' : 'text-gray-300'}`}></div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="relative aspect-square rounded-full overflow-hidden border-4 border-gray-100 bg-gray-900 mx-auto max-w-[280px]">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* Face Overlay Guideline */}
                            <div className="absolute inset-0 border-[30px] border-black border-opacity-30 rounded-full"></div>
                            
                            {isProcessing && (
                                <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                                    <div className="icon-loader text-white text-5xl animate-spin"></div>
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-2">
                            <p className={`font-bold ${statusMessage.includes('Error') ? 'text-red-600' : 'text-gray-700'}`}>
                                {statusMessage}
                            </p>
                            <p className="text-xs text-gray-400">
                                {mode === 'register' ? `Step ${registrationStep + 1}: ${steps[registrationStep].label}` : 'Maintain good lighting and keep your face within the circle.'}
                            </p>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={onCancel}
                                className="btn btn-secondary flex-1 py-3 rounded-2xl font-bold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleProcess}
                                disabled={!isModelLoaded || isProcessing}
                                className="btn btn-primary flex-1 py-3 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <div className="icon-loader animate-spin"></div>
                                ) : (
                                    <div className="icon-circle-check text-lg"></div>
                                )}
                                {mode === 'register' ? 'Capture' : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('FaceRecognition component error:', error);
        return null;
    }
}