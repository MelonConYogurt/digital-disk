"use client";

import {useState, useEffect} from "react";

function ColorPicker({selectColor}) {
  const [color, setColor] = useState("#006dee");
  const [formattedColor, setFormattedColor] = useState("rgb(0, 109, 238)");
  const [colorList] = useState([
    "#E63946",
    "#F4A261",
    "#2A9D8F",
    "#264653",
    "#A8DADC",
    "#457B9D",
    "#E76F51",
    "#9B5DE5",
    "#F15BB5",
    "#00F5D4",
    "#C0FDFB",
    "#FFBE0B",
    "#D81159",
    "#8AC926",
    "#6A0572",
    "#D4A5A5",
    "#5F0F40",
    "#6EEB83",
    "#FFD6A5",
    "#BDE0FE",
  ]);

  useEffect(() => {
    const newColor = formatColor(color);
    setFormattedColor(newColor);
    selectColor(newColor);
  }, [color]);

  function handleChangeColor(event) {
    setColor(event.target.value);
  }

  function handleRecentColor(presetColor) {
    setColor(presetColor);
  }

  function formatColor(color) {
    const r = Number.parseInt(color.substring(1, 3), 16);
    const g = Number.parseInt(color.substring(3, 5), 16);
    const b = Number.parseInt(color.substring(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function rgbToHex(r, g, b) {
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  return (
    <div className="flex flex-row gap-3 ">
      <div className="flex flex-col items-center gap-2">
        <div className="relative group">
          <div
            className="w-12 h-12 rounded-full shadow-inner overflow-hidden border-2 border-gray-300/50  transition-all duration-200 hover:border-gray-300"
            style={{background: `linear-gradient(135deg, white, ${color})`}}
          >
            <input
              type="color"
              value={color}
              onBlur={() => {
                const rgb = formattedColor.match(/\d+/g);
                const hexColor = rgbToHex(
                  Number.parseInt(rgb[0]),
                  Number.parseInt(rgb[1]),
                  Number.parseInt(rgb[2])
                );
                if (!colorList.includes(hexColor)) {
                  colorList.push(hexColor);
                }
              }}
              onChange={handleChangeColor}
              className="cursor-pointer w-full h-full opacity-0"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 border-2 border-gray-300/50 rounded-full w-6 h-6 bg-gray-800 text-white flex justify-center items-center shadow-md pointer-events-none">
            <span className="text-sm font-bold">+</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center h-16 w-xl gap-2 flex-1">
        <div className="flex flex-wrap gap-2 w-full max-h-20 overflow-y-auto p-2 bg-gray-100/10 border border-gray-300/30 rounded-lg shadow-inner">
          {colorList.map((presetColor, index) => (
            <div
              key={index}
              className="bg-transparent hover:bg-gray-200/30 flex justify-center items-center p-1 rounded-full transition-all duration-150"
            >
              <button
                className={`w-6 h-6 rounded-full shadow-md cursor-pointer transition-all duration-200 hover:scale-110 ${
                  presetColor === color
                    ? "ring-2 ring-offset-2 ring-gray-700"
                    : "border border-gray-300/50"
                }`}
                style={{backgroundColor: presetColor}}
                onClick={() => handleRecentColor(presetColor)}
                title={presetColor}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ColorPicker;
