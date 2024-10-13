import React, { useEffect, useRef, useState } from 'react';

const BACKEND_URL = "http://18.116.13.65:8000"
const REC_WINDOW = 5000
const INTERVAL = 100
const BUFSIZE = REC_WINDOW / INTERVAL

const CamView = () => {
  const videoRef = useRef(null); 
  const canvasRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [translation, setTranslation] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const getWebcamStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the webcam: ", err);
      }
    };
    getWebcamStream();
  }, []);

  const increcmentalSnap = (n) => {
    if (n <= 0) return 

    setTimeout(() => increcmentalSnap(n-1), INTERVAL)
    takePicture()
  }

  useEffect(() => {
    if (isRecording) {
      increcmentalSnap(BUFSIZE); 
    }

  }, [isRecording]);

  const handleButton = async () => {
    setIsRecording(true);
    setIsProcessing(true);
    setTranslation("");

    fetch(BACKEND_URL + "/clearBuffer", {method: "GET"});

    setTimeout( async () =>{
      setIsRecording(false);
      await fetch(BACKEND_URL + "/getTranslation")
        .then(res => res.json())
        .then(data => {
          setTranslation(data.msg);
          setIsProcessing(false);
        })
    }, REC_WINDOW);
  }

  const takePicture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Set canvas dimensions to match the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    // Draw the video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the data URL of the image
    const imageData = canvas.toDataURL('image/png');
    
    setCapturedImage(imageData);

    fetch(BACKEND_URL + "/postFrame", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time: Date.now(),
        data: String(imageData)
      }),
    });
  }


  return (
    <>
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded-lg w-full h-full object-cover"
        />
      </div>
    
      <button
        onClick={handleButton}
        className="px-4 py-2 my-2 text-white rounded-lg shadow transition"
      >
        {isProcessing ? isRecording ? "Recording" : "Processing" : "Start"}
      </button>

      <p>{translation}</p>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default CamView;

