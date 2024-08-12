import React, { useRef, useState, useEffect } from "react";
import "./Canvas.css";
import axios from "axios";

export default function Canvas() {
  const canvasRef = useRef(null);
  const headingRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [result, setResult] = useState(null); // Add state for the result

  useEffect(() => {
    const canvas = canvasRef.current;

    const startDrawing = (e) => {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      setLastPos({
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      });
      headingRef.current.style.display = "none";
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const currentY = (e.clientY - rect.top) * (canvas.height / rect.height);
      const context = canvas.getContext("2d");
      context.beginPath();
      context.moveTo(lastPos.x, lastPos.y);
      context.lineTo(currentX, currentY);
      context.strokeStyle = "#000";
      context.lineWidth = 35;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
      setLastPos({ x: currentX, y: currentY });
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
    };
  }, [isDrawing, lastPos]);

  const processDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;

    const isBlack = (alpha) => (alpha > 1 ? 1 : 0);
    const modifiedPixels = Array.from({ length: 280 }, () =>
      Array(280).fill(0)
    );

    let row = 0;
    let column = 0;

    for (let i = 0; i < pixelData.length; i += 4) {
      const a = pixelData[i + 3];
      const pixelValue = isBlack(a);
      modifiedPixels[row][column] = pixelValue;

      row++;
      if (row === 280) {
        row = 0;
        column++;
        if (column === 280) break;
      }
    }

    return resizeImageData(modifiedPixels);
  };

  function resizeImageData(pix) {
    const newPixel = Array.from({ length: 28 }, () => Array(28).fill(0));
    let a_count = 0;
    let n_index = 0;
    let m_index = 0;

    for (let i = 0; i < 28; i++) {
      for (let j = 0; j < 28; j++) {
        for (let n = 0; n < 10; n++) {
          for (let m = 0; m < 10; m++) {
            if (pix[n + n_index][m + m_index] === 1) a_count++;
          }
        }
        newPixel[i][j] = a_count > 45 ? 1 : 0;
        n_index += 10;
        a_count = 0;
      }
      m_index += 10;
      n_index = 0;
    }

    return newPixel;
  }

  async function predict() {
    const im = processDrawing();
    console.log("array: ", im);
    console.log("num black: ", im.flat().filter((pixel) => pixel === 1).length);
    console.log("array length: ", im.length * im[0].length);

    try {
      const response = await axios.post("http://localhost:3000/", {
        image: im,
      });
      // Assuming the backend sends the result as { result: <int> }
      setResult(response.data.result); // Store the result in the state
      console.log("array sent to the backend successfully.");
    } catch (error) {
      console.error("Error sending array to the backend:", error);
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    setResult(null);
  };

  return (
    <div>
      <h1 ref={headingRef} className="heading">
        Drawing App
      </h1>
      <canvas
        ref={canvasRef}
        className="canvas"
        width="280"
        height="280"
      ></canvas>
      <div className="btn-container">
        <button className="btn" onClick={predict}>
          Submit
        </button>
        <button className="btn" onClick={clearCanvas}>
          Clear
        </button>
      </div>
      {result !== null && (
        <div className="result">
          <h2>Prediction Result: {result}</h2>
        </div>
      )}
    </div>
  );
}
