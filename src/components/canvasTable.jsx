import {useRef, useState, useEffect} from "react";
import ColorPicker from "./colorPicker";
import {Toaster, toast} from "sonner";

export default function CanvasTable() {
  const previewCanvasRef = useRef(null);

  const layersRefs = useRef([]);

  const [layers, setLayers] = useState([
    {
      id: 0,
      active: true,
      visible: true,
      z: 0,
      name: `layer base`,
      undoStack: [],
      redoStack: [],
    },
  ]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isEraserActive, setIsEraserActive] = useState(false);
  const [erasing, setErasing] = useState(false);

  const [previousPosition, setPreviousPosition] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  const [hoveredCell, setHoveredCell] = useState(null);
  const [lastHoveredCell, setLastHoveredCell] = useState(null);

  const [cellWidth, setCellWidth] = useState(8);
  const [cellHeight, setCellHeight] = useState(8);

  const [rowCount, setRowCount] = useState(100);
  const [colCount, setColCount] = useState(100);

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
      const ctx = previewCanvas.getContext("2d", {willReadFrequently: true});
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

    if (!isDrawingActive && !isEraserActive) {
      toast.info("please select one tool frist");
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
      const ctx = canvas.getContext("2d", {willReadFrequently: true});
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
    const ctx = canvas.getContext("2d", {willReadFrequently: true});

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
    const ctx = canvas.getContext("2d", {willReadFrequently: true});

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

  function previewLayer(imageData) {
    if (!imageData) return "";

    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    let ctx = canvas.getContext("2d", {willReadFrequently: true});
    ctx.putImageData(imageData, 0, 0);

    ctx = null;
    return canvas.toDataURL();
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
        const ctx = canvas.getContext("2d", {willReadFrequently: true});

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
        const ctx = canvas.getContext("2d", {willReadFrequently: true});

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

    const ctx = canvas.getContext("2d", {willReadFrequently: true});
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

  function handleDropLayer(index) {
    setLayers((prev) => {
      return prev.filter((layer) => layer.id !== index);
    });
  }

  function handleLayerVisibility(index) {
    setLayers((prev) => {
      return prev.map((layer) => {
        if (layer.id === index) {
          return {...layer, visible: !layer.visible};
        }
        return layer;
      });
    });
  }

  function handleZindexPosition(index, position) {}

  function drawImage(image) {
    const ActiveLayerIndex = layers.findIndex((layer) => layer.active === true);
    const canvas = layersRefs.current[ActiveLayerIndex];

    if (!canvas) return;

    const img = new Image();
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      const ctx = canvas.getContext("2d", {willReadFrequently: true});
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;

      let width = imageData.width;
      let height = imageData.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let index = (y * width + x) * 4;

          let r = data[index];
          let g = data[index + 1];
          let b = data[index + 2];
          let a = data[index + 3];

          const colIndex = Math.floor(x / cellWidth);
          const rowIndex = Math.floor(y / cellHeight);

          const color = `rgb(${r}, ${g}, ${b}, ${a})`;
          drawCell(colIndex, rowIndex, color, canvas);
        }
      }
      URL.revokeObjectURL(img.src);
      handleTrace();
    };
  }

  function allowDragAndDrop(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    const upLoadFile = event.dataTransfer.files;

    if (upLoadFile.length > 1) {
      toast.error("Upload just one image");
      return;
    }

    const file = upLoadFile[0];
    if (file.type.startsWith("image/")) {
      toast.success("Image apliyed");
      drawImage(file);
    } else {
      toast.warning("Only image files");
    }
  }

  function handleChoseFile(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type.startsWith("image/")) {
      toast.success("Image applied");
      drawImage(file);
    } else {
      toast.warning("Only image files");
    }
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
                  display: layer.visible ? "block" : "none",
                  zIndex: 10,
                  pointerEvents: layer.active ? "auto" : "none",
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

      <nav className="flex flex-row justify-starts items-center bg-[#2f2f2f] w-full h-20 fixed top-0 left-0 z-50">
        <div className="flex flex-row gap-2 justify-center items-center h-full border-r-1 border-[#4d5058] px-4">
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
        <div className=" h-full flex justify-center items-center border-r-1 border-[#4d5058] px-4">
          <ColorPicker selectColor={handleColorChange} />
        </div>
        <div className=" h-full flex justify-center items-center border-r-1 border-[#4d5058] px-4">
          <button
            onClick={() => {
              console.log("Falta arreglar");
            }}
            className=" cursor-pointer"
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
        <div className=" h-full flex justify-center items-center gap-2 border-r-1 border-[#4d5058] px-4">
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
        <div className=" h-full flex justify-center items-center gap-2 border-r-1 border-[#4d5058] px-4">
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
        <label className="h-full flex justify-center items-center gap-2 border-r-1 border-[#4d5058] px-4">
          <div
            className="border border-dashed p-1 w-25 h-15 flex justify-center items-center rounded-md border-white hover:bg-[#555555] transition-all duration-100"
            onDragOver={allowDragAndDrop}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              backgroundColor: isDragging ? "#555555" : "#2f2f2f",
              transition: "all 100ms ease-in-out",
            }}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChoseFile}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-upload"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
        </label>
      </nav>

      <nav className="fixed right-2 top-1/2 -translate-y-1/2 min-h-40 w-fit bg-[#2f2f2f] p-2 py-4 rounded-md z-40 max-h-4/5 overflow-y-auto custom-scroll">
        <div className="flex flex-col  justify-center items-center gap-2">
          <div className="self-start border-b-2 border-[#4d5058] w-full flex flex-row justify-between items-center py-1 ">
            <p className="text-xl font-medium ">Layers </p>
            <button
              onClick={addLayer}
              className="cursor-pointer p-1 rounded-md hover:bg-[#555555]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-plus"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </button>
          </div>
          {layers.length > 0 ? (
            layers.map((layer) => (
              <div
                key={layer.id}
                style={{
                  backgroundColor: layer.active ? "rgb(25, 130, 255, 0.1)" : "",
                }}
                className="border-2 border-[#4d5058] p-2 rounded-md w-60 flex flex-col gap-2"
              >
                <div className="flex flex-row justify-between items-center w-full gap-2 ">
                  <div className="flex flex-row gap-1">
                    <button
                      className="cursor-pointer rounded-sm p-1 hover:bg-[#555555]"
                      onClick={() => handleLayerVisibility(layer.id)}
                    >
                      {layer.visible ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-eye"
                        >
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-eye-off"
                        >
                          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                          <path d="m2 2 20 20" />
                        </svg>
                      )}
                    </button>
                    <p>{layer.name}</p>
                  </div>
                  <div className="flex flex-row gap-1">
                    <button
                      className="cursor-pointer rounded-sm p-1 hover:bg-[#555555]"
                      onClick={() => handleZindexPosition(layer.id, "arriba")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chevron-up"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      className="cursor-pointer rounded-sm p-1 hover:bg-[#555555]"
                      onClick={() => handleZindexPosition(layer.id, "abajo")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chevron-down"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <button
                      className="cursor-pointer hover:bg-red-500 rounded-sm p-1"
                      onClick={() => handleDropLayer(layer.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-x"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  {layer.undoStack && layer.undoStack.length > 0 ? (
                    <div className="bg-white rounded-sm flex justify-center items-center">
                      <img
                        src={previewLayer(
                          layer.undoStack[layer.undoStack.length - 1]
                        )}
                        alt={`Vista previa de ${layer.name}`}
                        className="w-30 h-30 object-fill"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-16 bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                      Capa vacía
                    </div>
                  )}
                  <button
                    className="cursor-pointer p-1 px-2 rounded-md w-18 mt-2"
                    style={{
                      backgroundColor: layer.active ? "#156cd3" : "#4d5058",
                    }}
                    onClick={() => handleActiveLayer(layer.id)}
                  >{`${layer.active ? "Active" : "Activate"} `}</button>
                </div>
              </div>
            ))
          ) : (
            <p>No layers yet 🎈</p>
          )}
        </div>
      </nav>

      {isModalOpen ? (
        <div className="fixed inset-0 flex items-center justify-center backdrop-brightness-75  backdrop-blur-xs z-[100]">
          <div className="bg-[#292929] p-6 rounded-lg shadow-2xl max-w-xl w-full flex flex-col  items-start gap-2">
            <h2 className="text-2xl place-self-center">Configuration </h2>

            <div className="flex flex-col gap-5 justify-center items-center mt-5 w-full">
              <div className="flex flex-col gap-2 justify-center items-start border-b-2 border-[#4d5058] py-2 w-full">
                <p className="text-xl">Canvas size</p>
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
              <div className="flex flex-col gap-2 justify-center items-start border-b-2 border-[#4d5058] py-2 w-full">
                <p className="text-xl">Cell size</p>
                <div className="flex flex-row justify-center items-center gap-5">
                  <div className="inline-flex justify-center items-center gap-2">
                    <label htmlFor="cellWidth">Widht:</label>
                    <input
                      className="border border-gray-500 p-1 rounded-md w-20"
                      id="cellWidth"
                      type="number"
                      min={1}
                      max={32}
                      value={cellWidth}
                      onChange={(e) => {
                        setCellWidth(Number(e.target.value));
                      }}
                    />
                  </div>
                  <div className="inline-flex justify-center items-center gap-2">
                    <label htmlFor="cellHeight">Height:</label>
                    <input
                      className="border border-gray-500 p-1 rounded-md w-20"
                      id="cellHeight"
                      type="number"
                      min={1}
                      max={32}
                      value={cellHeight}
                      onChange={(e) => {
                        setCellHeight(Number(e.target.value));
                      }}
                    />
                  </div>
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
                className="cursor-pointer p-1 px-2 rounded-md w-18 bg-[#156cd3] hover:bg-[#0f51a0] transition-all duration-100"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      <Toaster richColors position="top-center" />
    </section>
  );
}
