import {useRef, useState, useEffect} from "react";
import ColorPicker from "./colorPicker";

export default function CanvasTable() {
  const previewCanvasRef = useRef(null);

  const layersRefs = useRef([]);

  const [layers, setLayers] = useState([
    {
      id: 0,
      active: true,
      visible: true,
      name: `layer base`,
      undoStack: [],
      redoStack: [],
    },
  ]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);

  const [isEraserActive, setIsEraserActive] = useState(false);
  const [erasing, setErasing] = useState(false);

  const [previousPosition, setPreviousPosition] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  const [hoveredCell, setHoveredCell] = useState(null);
  const [lastHoveredCell, setLastHoveredCell] = useState(null);

  const [cellWidth, setCellWidth] = useState(8);
  const [cellHeight, setCellHeight] = useState(8);

  const [rowCount, setRowCount] = useState(64);
  const [colCount, setColCount] = useState(64);

  const [selectedColor, setSelectedColor] = useState("#ff00eb");

  const [zoomLevel, setZoomLevel] = useState(1);
  const [origin, setOrigin] = useState({x: 0, y: 0});

  const [pixelSize, setPixelSize] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(true);

  const [isConfigReady, setIsConfigReady] = useState(false);

  const canvasWidth = colCount * cellWidth;
  const canvasHeight = rowCount * cellHeight;

  function handleModal() {
    setIsModalOpen(false);
    setIsConfigReady(true);
    handleTrace();
  }

  function handleCols(value) {
    setColCount(value);
  }

  function handleRows(value) {
    setRowCount(value);
  }

  function handlePixelSize(event) {
    setPixelSize(event.target.value);
  }

  function handleColorChange(color) {
    setSelectedColor(color);
    setIsEraserActive(false);
  }

  function cancelDrawing() {
    setIsDrawing(false);
    clearPreview();
  }

  function clearPreview() {
    try {
      const previewCanvas = previewCanvasRef.current;
      const ctx = previewCanvas.getContext("2d");
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      setLastHoveredCell(null);
      setHoveredCell(null);
    } catch (error) {
      console.log(error);
    }
  }

  function toggleEraser() {
    setIsEraserActive((prev) => !prev);
    setIsDrawingActive(false);
    setIsDrawing(false);
    setErasing(false);
  }

  function toggleDrawing() {
    setIsDrawingActive((prev) => !prev);
    setIsEraserActive(false);
    setIsDrawing(false);
    setErasing(false);
  }

  function OnMouseDownDraw(event) {
    const [x, y] = getMouseCoordinates(event);
    const colIndex = Math.floor(x / cellWidth);
    const rowIndex = Math.floor(y / cellHeight);
    const canvas = event.target;

    if (isDrawingActive) {
      setIsDrawing(true);
      setPreviousPosition(null);
      setCurrentPosition(null);

      if (!isDrawing) {
        const color = selectedColor;
        drawCell(colIndex, rowIndex, color, canvas);
      }
    } else {
      if (isEraserActive) {
        setErasing(true);
        eraseCell(colIndex, rowIndex, canvas);
      }
    }
  }

  function OnMouseUpDraw() {
    setIsDrawing(false);
    setErasing(false);
  }

  function getMouseCoordinates(event) {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    return [x, y];
  }

  function updatePreview(event) {
    if (!isDrawing) {
      const [x, y] = getMouseCoordinates(event);

      const colIndex = Math.floor(x / cellWidth);
      const rowIndex = Math.floor(y / cellHeight);

      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext("2d");
      const color = "rgba(0, 0, 0, 0.5)";

      if (lastHoveredCell && hoveredCell) {
        if (
          lastHoveredCell[0] !== hoveredCell[0] ||
          lastHoveredCell[1] !== hoveredCell[1]
        ) {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        }
      }

      setHoveredCell([colIndex, rowIndex]);
      setLastHoveredCell(hoveredCell);

      if (lastHoveredCell && hoveredCell) {
        if (
          hoveredCell[0] !== lastHoveredCell[0] ||
          hoveredCell[1] !== lastHoveredCell[1]
        ) {
          drawCell(colIndex, rowIndex, color, canvas);
        }
      } else {
        return;
      }
    }
  }

  function eraseCell(x, y, canvas) {
    const ctx = canvas.getContext("2d");

    let initialX = x - (pixelSize - 1);
    let initialY = y - (pixelSize - 1);

    for (let i = initialX; i <= x; i++) {
      for (let j = initialY; j <= y; j++) {
        const newX = i * cellWidth;
        const newY = j * cellHeight;
        ctx.clearRect(newX, newY, cellWidth, cellHeight);
      }
    }
  }

  function drawCell(x, y, color, canvas) {
    const ctx = canvas.getContext("2d");

    if (erasing) {
      eraseCell(x, y, canvas);
    } else {
      let initialX = x - (pixelSize - 1);
      let initialY = y - (pixelSize - 1);

      for (let i = initialX; i <= x; i++) {
        for (let j = initialY; j <= y; j++) {
          const newX = i * cellWidth;
          const newY = j * cellHeight;

          if (canvas !== previewCanvasRef.current) {
            ctx.fillStyle = color;
            ctx.fillRect(newX, newY, cellWidth, cellHeight);
          } else if (canvas === previewCanvasRef.current) {
            ctx.fillStyle = color;
            ctx.fillRect(newX, newY, cellWidth, cellHeight);
          }
        }
      }
    }
  }

  function handleMouseDraw(event) {
    const [x, y] = getMouseCoordinates(event);
    const canvas = event.target;

    const colIndex = Math.floor(x / cellWidth);
    const rowIndex = Math.floor(y / cellHeight);

    if (erasing) {
      clearPreview();
      eraseCell(colIndex, rowIndex, canvas);
    }

    if (isDrawing) {
      clearPreview();

      const prevPos = currentPosition;
      const newPos = [colIndex, rowIndex];

      setCurrentPosition(newPos);
      setPreviousPosition(prevPos);

      if (prevPos) {
        interpolateCells(prevPos, newPos, canvas);
      }
    } else {
      updatePreview(event);
    }
  }

  function interpolateCells(prev, curr, canvas) {
    if (prev && curr) {
      let [x1, y1] = prev;
      let [x2, y2] = curr;

      while (x1 !== x2 || y1 !== y2) {
        const color = selectedColor;
        drawCell(x1, y1, color, canvas);

        if (x1 < x2) x1++;
        else if (x1 > x2) x1--;

        if (y1 < y2) y1++;
        else if (y1 > y2) y1--;
      }

      drawCell(x2, y2, selectedColor, canvas);
    }
  }

  function handleZoom(event) {
    const [x, y] = getMouseCoordinates(event);
    setOrigin({x: x, y: y});
    if (event.deltaY < 0) {
      setZoomLevel((prev) => prev * 1.2);
    } else {
      setZoomLevel((prev) => prev / 1.2);
    }
  }

  function zoomIn() {
    setZoomLevel((prev) => prev * 1.2);
  }

  function zoomOut() {
    setZoomLevel((prev) => prev / 1.2);
  }

  function saveCanvas(canvas) {
    // const dataURL = canvas.toDataURL("image/png");

    // const downloadLink = document.createElement("a");
    // downloadLink.href = dataURL;
    // downloadLink.download = "pixel-art.png";

    // document.body.appendChild(downloadLink);
    // downloadLink.click();
    // document.body.removeChild(downloadLink);

    // return dataURL;
    console.log("Falta arreglar");
  }

  function addLayer() {
    const id = layers.length;
    const imageData = layers[0].undoStack[0];

    setLayers((prev) => [
      ...prev,
      {
        id: id,
        active: false,
        visible: true,
        name: `layer ${id}`,
        undoStack: [imageData],
        redoStack: [],
      },
    ]);
  }

  function undo() {
    const ActiveLayerIndex = layers.findIndex((layer) => layer.active === true);
    const ActiveLayer = layers[ActiveLayerIndex];

    if (ActiveLayer) {
      if (ActiveLayer.undoStack.length > 1) {
        const imageData =
          ActiveLayer.undoStack[ActiveLayer.undoStack.length - 1];
        const prevImage =
          ActiveLayer.undoStack[ActiveLayer.undoStack.length - 2];

        const canvas = layersRefs.current[ActiveLayerIndex];
        const ctx = canvas.getContext("2d");

        ctx.putImageData(prevImage, 0, 0);

        setLayers((prev) => {
          return prev.map((layer) => {
            if (layer.active) {
              return {
                ...layer,
                redoStack: [...layer.redoStack, imageData],
                undoStack: layer.undoStack.slice(0, -1),
              };
            }
            return layer;
          });
        });
      }
    }
  }

  function redo() {
    const ActiveLayerIndex = layers.findIndex((layer) => layer.active === true);
    const ActiveLayer = layers[ActiveLayerIndex];

    if (ActiveLayer) {
      if (ActiveLayer.redoStack.length > 0) {
        const canvas = layersRefs.current[ActiveLayerIndex];
        const ctx = canvas.getContext("2d");

        const imageData =
          ActiveLayer.redoStack[ActiveLayer.redoStack.length - 1];
        ctx.putImageData(imageData, 0, 0);

        setLayers((prev) => {
          return prev.map((layer) => {
            if (layer.active) {
              return {
                ...layer,
                redoStack: layer.redoStack.slice(0, -1),
                undoStack: [...layer.undoStack, imageData],
              };
            }
            return layer;
          });
        });
      }
    }
  }

  function handleTrace() {
    const canvasIndex = layers.findIndex((layer) => layer.active === true);
    const canvas = layersRefs.current[canvasIndex];

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    setLayers((prev) => {
      return prev.map((layer) => {
        if (layer.active === true) {
          return {
            ...layer,
            undoStack: [...layer.undoStack, imageData],
            redoStack: [],
          };
        }
        return layer;
      });
    });
  }

  function handleActiveLayer(index) {
    setLayers((prev) => {
      return prev.map((layer) => {
        if (layer.id === index) {
          return {...layer, active: true};
        } else if (layer.active === true) {
          return {...layer, active: false};
        } else {
          return layer;
        }
      });
    });
  }

  useEffect(() => {
    if (isConfigReady && !isDrawing && !erasing) {
      handleTrace();
    }
  }, [isDrawing, erasing]);

  return (
    <section className="flex flex-col text-gray-200">
      <div className="py-30 flex justify-center items-center w-full">
        <div
          onPointerMove={handleMouseDraw}
          className="relative overflow-auto"
          style={{
            backgroundColor: "white",
            background:
              "repeating-conic-gradient(#f0f0f0 0deg 90deg, white 90deg 180deg)",
            backgroundSize: `${cellWidth * 2}px ${cellHeight * 2}px`,
            width: canvasWidth,
            height: canvasHeight,
            scale: zoomLevel,
            transformOrigin: `${origin.x !== 0 ? origin.x + "px" : "50%"} ${
              origin.y !== 0 ? origin.y + "px" : "50%"
            }`,
          }}
        >
          {layers.length > 0 ? (
            layers.map((layer, index) => (
              <canvas
                key={layer.id}
                className="absolute top-0 left-0"
                onPointerMove={handleMouseDraw}
                onPointerDown={OnMouseDownDraw}
                onPointerUp={OnMouseUpDraw}
                onPointerLeave={cancelDrawing}
                onWheel={handleZoom}
                width={canvasWidth}
                height={canvasHeight}
                style={{
                  visibility: layer.visible === true ? "visible" : "hidden",
                  zIndex: 10,
                  pointerEvents: layer.active === true ? "auto" : "none",
                }}
                ref={(element) => (layersRefs.current[index] = element)}
              ></canvas>
            ))
          ) : (
            <></>
          )}

          <canvas
            id="Canvas-preview"
            className="absolute top-0 left-0 z-20 pointer-events-none"
            ref={previewCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
          ></canvas>
        </div>
      </div>

      <nav className="fixed left-2 shadow top-1/2 -translate-y-1/2 bg-[#2f2f2f] p-2 py-4 gap-2 flex flex-col justify-center items-center rounded-md w-12 z-40 ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1.5rem"
          height="1.5rem"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2 2 22" />
        </svg>
        <input
          type="range"
          className=" slider-pixel-size"
          min={1}
          max={24}
          onChange={handlePixelSize}
          value={pixelSize}
        />
        <div>
          <p>{`${pixelSize}px`}</p>
        </div>
      </nav>

      <nav className="flex flex-row justify-starts items-center bg-[#2f2f2f]  w-full h-20 fixed top-0 left-0 z-50 border-b border-gray-500">
        <div className="flex flex-row gap-2 justify-center items-center px-4 border-r border-gray-500 h-full">
          <button
            className={`border border-gray-400 p-1 rounded-md w-9 h-9 ${
              isEraserActive ? "bg-[#555555]" : ""
            } cursor-pointer`}
            onClick={toggleEraser}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.5rem"
              height="1.5rem"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
              <path d="M22 21H7" />
              <path d="m5 11 9 9" />
            </svg>
          </button>
          <button
            className={`border border-gray-400 p-1 rounded-md w-9 h-9 ${
              isDrawingActive ? "bg-[#555555]" : ""
            } cursor-pointer`}
            onClick={toggleDrawing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
              <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
            </svg>
          </button>
        </div>
        <div className="border-r border-gray-500 h-full flex justify-center items-center px-4">
          <ColorPicker selectColor={handleColorChange} />
        </div>
        <div className="border-r border-gray-500 h-full flex justify-center items-center">
          <button
            onClick={() => {
              console.log("Falta arreglar");
            }}
            className="px-4 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.5rem"
              height="1.5rem"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
        </div>
        <div className="border-r border-gray-500 h-full flex justify-center items-center gap-2 px-4">
          <div
            className="border border-gray-400 p-1 rounded-md w-9 h-9 cursor-pointer"
            onClick={undo}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </div>

          <div
            className="border border-gray-400 p-1 rounded-md w-9 h-9 cursor-pointer"
            onClick={redo}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
            </svg>
          </div>
        </div>
        <div className="border-r border-gray-500 h-full flex justify-center items-center gap-2 px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-pointer"
            onClick={zoomIn}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
            <line x1="11" x2="11" y1="8" y2="14" />
            <line x1="8" x2="14" y1="11" y2="11" />
          </svg>
          <p>{`${Math.round(zoomLevel * 100)}%`}</p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-pointer"
            onClick={zoomOut}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
            <line x1="8" x2="14" y1="11" y2="11" />
          </svg>
        </div>
        <div className="border-r border-gray-500 h-full flex justify-center items-center gap-2 px-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-pointer"
            onClick={addLayer}
          >
            <path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74L7.98 12" />
            <path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74Z" />
          </svg>
        </div>
        <div className="border-r border-gray-500 h-full flex justify-center items-center gap-2 px-4">
          <button onClick={() => console.log(layers)}>Ver capas 👻</button>
        </div>
      </nav>

      <nav className="fixed right-2 top-1/2 -translate-y-1/2 min-h-40 w-fit bg-[#2f2f2f] p-2 py-4 rounded-md z-40">
        <div className="flex flex-col  justify-center items-center gap-2">
          <p className="text-lg font-medium">Layers</p>
          {layers.length > 0 ? (
            layers.map((layer) => (
              <div
                key={layer.id}
                className="border border-gray-400 p-1 rounded-md cursor-pointer"
                onClick={() => handleActiveLayer(layer.id)}
              >
                <p>Layer: {layer.id}</p>
                <p>State: {layer.active ? "Active" : "No active"}</p>
              </div>
            ))
          ) : (
            <p>No layers yet 🎈</p>
          )}
        </div>
      </nav>

      {isModalOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent backdrop-blur-xs z-[100]">
          <div className="bg-[#292929] p-6 rounded-lg shadow-2xl max-w-xl w-full flex flex-col  items-start gap-2">
            <h2 className="text-2xl place-self-center">Configuration </h2>

            <div className="flex flex-col gap-5 justify-center items-center mt-5">
              <p className="self-start text-xl">Canvas sizes:</p>
              <div className="flex flex-row justify-center items-center gap-5">
                <div className="inline-flex justify-center items-center gap-2">
                  <label htmlFor="rows">Widht:</label>
                  <input
                    className="border border-gray-500 p-1 rounded-md w-20"
                    id="rows"
                    type="number"
                    min={1}
                    max={300}
                    placeholder={colCount}
                    onChange={(e) => {
                      handleCols(e.target.value);
                    }}
                  />
                </div>
                <div className="inline-flex justify-center items-center gap-2">
                  <label htmlFor="cols">Height:</label>
                  <input
                    className="border border-gray-500 p-1 rounded-md w-20"
                    id="cols"
                    type="number"
                    min={1}
                    max={300}
                    placeholder={rowCount}
                    onChange={(e) => {
                      handleRows(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xl mt-10 mb-5">Presets</p>

              <div className="flex flex-wrap gap-2">
                <div
                  onClick={() => (handleCols(16), handleRows(16))}
                  className="border border-gray-500 p-2 rounded-md flex flex-col justify-center items-center cursor-pointer hover:bg-[#2f2f2f] hover:-translate-y-0.5 transition-all duration-100 w-30 h-20"
                >
                  <p className="text-lg">Favicon</p>
                  <p className="text-sm text-gray-300">16 x 16</p>
                </div>

                <div
                  onClick={() => (handleCols(32), handleRows(32))}
                  className="border border-gray-500 p-2 rounded-md flex flex-col justify-center items-center cursor-pointer hover:bg-[#2f2f2f] hover:-translate-y-0.5 transition-all duration-100 w-30 h-20"
                >
                  <p className="text-lg">Small</p>
                  <p className="text-sm text-gray-300">32 x 32</p>
                </div>

                <div
                  onClick={() => (handleCols(64), handleRows(64))}
                  className="border border-gray-500 p-2 rounded-md flex flex-col justify-center items-center cursor-pointer hover:bg-[#2f2f2f] hover:-translate-y-0.5 transition-all duration-100 w-30 h-20"
                >
                  <p className="text-lg">Medium</p>
                  <p className="text-sm text-gray-300">64 x 64</p>
                </div>

                <div
                  onClick={() => (handleCols(128), handleRows(128))}
                  className="border border-gray-500 p-2 rounded-md flex flex-col justify-center items-center cursor-pointer hover:bg-[#2f2f2f] hover:-translate-y-0.5 transition-all duration-100 w-30 h-20"
                >
                  <p className="text-lg">Large</p>
                  <p className="text-sm text-gray-300">128 x 128</p>
                </div>

                <div
                  onClick={() => (handleCols(48), handleRows(48))}
                  className="border border-gray-500 p-2 rounded-md flex flex-col justify-center items-center cursor-pointer hover:bg-[#2f2f2f] hover:-translate-y-0.5 transition-all duration-100 w-30 h-20"
                >
                  <p className="text-lg">Emoji</p>
                  <p className="text-sm text-gray-300">48 x 48</p>
                </div>
              </div>
            </div>

            <div className="self-end">
              <button
                onClick={handleModal}
                className="border border-gray-500 p-1 px-2 rounded-md cursor-pointer hover:bg-[#2f2f2f]"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </section>
  );
}
