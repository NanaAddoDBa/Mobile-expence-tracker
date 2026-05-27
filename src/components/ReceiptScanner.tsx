import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  FileImage, 
  Zap, 
  Image,
  Loader2,
  CameraOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    vendorName: string;
    totalAmount: number;
    transactionDate: string;
    category: string;
  }) => void;
  onClose: () => void;
}

export default function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Video capture refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Turn on camera feed
  const startCamera = async () => {
    setErrorMessage(null);
    setMode('camera');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera entry error:", err);
      setErrorMessage("Could not access your device's camera. Feel free to upload a quick photo or check permissions.");
      setMode('select');
    }
  };

  // Close / Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture frame from video feed
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match actual camera output
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to JPEG data url
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(dataUrl);
    stopCamera();
    setMode('preview');
    
    // Automatically start scanning!
    triggerOcrScan(dataUrl);
  };

  // Handle selected image file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setMode('preview');
      triggerOcrScan(base64);
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read the selected file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini API call on express backend
  const triggerOcrScan = async (base64Image: string) => {
    setScanning(true);
    setErrorMessage(null);
    setSuccessData(null);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "An error occurred while calling the Gemini API on server.");
      }

      setSuccessData(resData.data);
    } catch (err: any) {
      console.error("OCR API failed:", err);
      setErrorMessage(err.message || "Failed to parse receipt. Please make sure the image is clear and try again.");
    } finally {
      setScanning(false);
    }
  };

  // Accept and apply pre-fill
  const handleApplyData = () => {
    if (successData) {
      onScanComplete(successData);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 font-sans select-none">
      
      {/* Dynamic Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-505 animate-pulse shrink-0" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Smart AI Receipt Scanner
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-xs rounded-xl flex items-start gap-2 border border-rose-100 dark:border-rose-950/50">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Scanning Issue</p>
            <p className="mt-0.5 leading-normal opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Mode selection - Initial */}
      {mode === 'select' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Live camera button */}
          <button
            type="button"
            onClick={startCamera}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs group transition cursor-pointer"
          >
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center text-indigo-505 mb-3 group-hover:scale-110 transition">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-150">Take Receipt Photo</span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 text-center mt-1 leading-normal">
              Snap high-res photo using direct camera
            </span>
          </button>

          {/* Upload file field */}
          <label className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs cursor-pointer group transition text-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center text-slate-500 mb-3 group-hover:scale-110 transition">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-150">Upload Receipt Image</span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 text-center mt-1 leading-normal">
              Select or drop an existing photo/screenshot
            </span>
          </label>
        </div>
      )}

      {/* Live camera viewport */}
      {mode === 'camera' && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl bg-black aspect-3/4 border border-slate-700/50 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover transform min-h-[280px]"
            />
            
            {/* Camera targeting viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-8">
              <div className="w-full flex justify-between">
                <div className="w-5 h-5 border-t-2 border-l-2 border-white/60 rounded-tl-[4px]" />
                <div className="w-5 h-5 border-t-2 border-r-2 border-white/60 rounded-tr-[4px]" />
              </div>
              <div className="text-center bg-black/60 backdrop-blur-md text-[10px] text-white/90 font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                Align receipt clearly in center
              </div>
              <div className="w-full flex justify-between">
                <div className="w-5 h-5 border-b-2 border-l-2 border-white/60 rounded-bl-[4px]" />
                <div className="w-5 h-5 border-b-2 border-r-2 border-white/60 rounded-br-[4px]" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setMode('select');
              }}
              className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-850 hover:bg-slate-305 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-1 py-2.5 bg-indigo-505 hover:bg-indigo-450 text-white rounded-xl text-xs font-black transition shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Capture Frame</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden storage canvas for photo rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanning status and preview data block */}
      {mode === 'preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Visual preview with scan lasers effects */}
            <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl max-h-[220px] flex items-center justify-center aspect-video">
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Receipt Scan"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Glowing animated vertical laserscan bar when analyzing */}
              <AnimatePresence>
                {scanning && (
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute inset-x-0 h-1.5 bg-indigo-500 shadow-lg shadow-indigo-500/70 border-b border-indigo-400 pointer-events-none opacity-80"
                  />
                )}
              </AnimatePresence>
              
              {scanning && (
                <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-xs text-center py-2 text-[10px] font-bold text-indigo-400 tracking-wider uppercase flex items-center justify-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing using Gemini OCR...
                </div>
              )}
            </div>

            {/* Ingested parsed results */}
            <div className="flex flex-col justify-between">
              {scanning ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Reading receipt receipts...</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500">Extracting subtotal, vendor items, dynamic timestamps & currency.</p>
                </div>
              ) : successData ? (
                <div className="flex-1 space-y-3 p-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-505 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 shrink-0" /> OCR extraction completed!
                  </span>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Store Merchant Name</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                      {successData.vendorName || '(Not detected)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Total Amount</span>
                      <span className="text-xs font-black text-indigo-505 block font-mono">
                        ${successData.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Receipt Date</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 block font-mono">
                        {successData.transactionDate || '(Not detected)'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Matching Category</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/35 text-indigo-600 dark:text-indigo-400 border border-indigo-200/20">
                      {successData.category || 'Other'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <Image className="w-10 h-10 text-slate-350 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Awaiting parsing run</p>
                </div>
              )}

              {/* Action operations */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-850 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setSuccessData(null);
                    setErrorMessage(null);
                    setMode('select');
                  }}
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-850 hover:bg-slate-305 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                  disabled={scanning}
                >
                  Restart
                </button>
                <button
                  type="button"
                  onClick={handleApplyData}
                  className="flex-1 py-2 bg-emerald-550 hover:bg-emerald-455 text-white rounded-xl text-xs font-black transition disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-emerald-500/10 cursor-pointer text-center flex items-center justify-center"
                  disabled={scanning || !successData}
                >
                  Apply & Pre-fill
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
