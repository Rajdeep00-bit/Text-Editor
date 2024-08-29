import React, { useState, useCallback, useRef } from 'react';
import './TextEditor.css';

function Dashboard({ onAddText, onUndo, onRedo, onChangeColor, onChangeFontSize, onChangeFontStyle, selectedTextId, fontSizeInput, setFontSizeInput }) {
  return (
    <div className="dashboard">
      <button onClick={onAddText}>Add Text</button>
      <button onClick={onUndo}>Undo</button>
      <button onClick={onRedo}>Redo</button>
      <button onClick={onChangeColor}>Change Color</button>
      <div className="font-size-input">
        <input
          type="number"
          value={fontSizeInput}
          onChange={(e) => setFontSizeInput(e.target.value)}
          placeholder="Font size"
          min="1"
          max="200"
        />
        <button onClick={onChangeFontSize} disabled={!selectedTextId || !fontSizeInput}>Set Font Size</button>
      </div>
      <div className="font-style-input">
        <button onClick={onChangeFontStyle}>Change Font Style</button>
      </div>
    </div>
  );
}

function TextEditor() {
  const [texts, setTexts] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [fontSizeInput, setFontSizeInput] = useState('');
  const [showFontStylePicker, setShowFontStylePicker] = useState(false);
  const [selectedFontStyle, setSelectedFontStyle] = useState('Arial');
  const [history, setHistory] = useState([]);
  const [futureStates, setFutureStates] = useState([]);
  const editorRef = useRef(null);

  const DEFAULT_FONT_SIZE = 16;
  const DEFAULT_FONT_STYLE = 'Arial';

  const addText = () => {
    const newText = {
      id: Date.now(),
      content: 'New Text',
      color: '#000000',
      rotation: 0,
      fontSize: DEFAULT_FONT_SIZE,
      fontStyle: DEFAULT_FONT_STYLE,
      x: Math.random() * 400,
      y: Math.random() * 400,
      width: 100,
      height: 30,
    };
    setTexts(prevTexts => {
      const newTexts = [...prevTexts, newText];
      setHistory([...history, prevTexts]);
      setFutureStates([]);
      return newTexts;
    });
    setSelectedTextId(newText.id);
    setFontSizeInput(DEFAULT_FONT_SIZE.toString());
  };

  const updateText = useCallback((id, updates) => {
    setTexts(prevTexts => {
      const newTexts = prevTexts.map(text => 
        text.id === id ? { ...text, ...updates } : text
      );
      setHistory([...history, prevTexts]);
      setFutureStates([]);
      return newTexts;
    });
  }, [history]);

  const handleDragStart = useCallback((id, startEvent) => {
    startEvent.preventDefault();
    const text = texts.find(t => t.id === id);
    if (!text) return;

    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    const startLeft = text.x;
    const startTop = text.y;

    const handleDragMove = (moveEvent) => {
      if (!editorRef.current) return;
      const editorRect = editorRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newX = Math.max(0, Math.min(editorRect.width - text.width, startLeft + deltaX));
      const newY = Math.max(0, Math.min(editorRect.height - text.height, startTop + deltaY));

      updateText(id, { x: newX, y: newY });
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [texts, updateText]);

  const handleRotationStart = useCallback((id, startEvent) => {
    startEvent.preventDefault();
    const text = texts.find(t => t.id === id);
    if (!text) return;

    const startAngle = text.rotation;
    const startMouseX = startEvent.clientX;
    const startMouseY = startEvent.clientY;

    const handleRotationMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const newRotation = (startAngle + angle + 360) % 360;
      updateText(id, { rotation: newRotation });
    };

    const handleRotationEnd = () => {
      document.removeEventListener('mousemove', handleRotationMove);
      document.removeEventListener('mouseup', handleRotationEnd);
    };

    document.addEventListener('mousemove', handleRotationMove);
    document.addEventListener('mouseup', handleRotationEnd);
  }, [texts, updateText]);

  const handleResizeStart = useCallback((id, corner, startEvent) => {
    startEvent.preventDefault();
    const text = texts.find(t => t.id === id);
    if (!text) return;

    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    const startWidth = text.width;
    const startHeight = text.height;

    const handleResizeMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (corner.includes('right')) {
        newWidth = Math.max(50, startWidth + deltaX);
      } else if (corner.includes('left')) {
        newWidth = Math.max(50, startWidth - deltaX);
      }

      if (corner.includes('bottom')) {
        newHeight = Math.max(20, startHeight + deltaY);
      } else if (corner.includes('top')) {
        newHeight = Math.max(20, startHeight - deltaY);
      }

      updateText(id, { width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [texts, updateText]);

  const changeColor = () => {
    if (selectedTextId) {
      updateText(selectedTextId, { color: selectedColor });
      setShowColorPicker(false);
    }
  };

  const changeFontSize = () => {
    if (selectedTextId && fontSizeInput) {
      const newSize = Math.max(1, Math.min(200, parseInt(fontSizeInput)));
      updateText(selectedTextId, { fontSize: newSize });
    }
  };

  const changeFontStyle = (fontStyle) => {
    if (selectedTextId) {
      updateText(selectedTextId, { fontStyle });
      setShowFontStylePicker(false);
    }
  };

  const undo = () => {
    if (history.length > 0) {
      const prevState = history[history.length - 1];
      setFutureStates([texts, ...futureStates]);
      setTexts(prevState);
      setHistory(history.slice(0, -1));
    }
  };

  const redo = () => {
    if (futureStates.length > 0) {
      const nextState = futureStates[0];
      setHistory([...history, texts]);
      setTexts(nextState);
      setFutureStates(futureStates.slice(1));
    }
  };

  const handleTextClick = (id) => {
    setSelectedTextId(id);
    const selectedText = texts.find(text => text.id === id);
    setFontSizeInput(selectedText.fontSize.toString());
    setSelectedFontStyle(selectedText.fontStyle);
  };

  const handleTextChange = (id, newContent) => {
    updateText(id, { content: newContent });
  };

  return (
    <div className="text-editor">
      <Dashboard
        onAddText={addText}
        onUndo={undo}
        onRedo={redo}
        onChangeColor={() => setShowColorPicker(!showColorPicker)}
        onChangeFontSize={changeFontSize}
        onChangeFontStyle={() => setShowFontStylePicker(!showFontStylePicker)}
        selectedTextId={selectedTextId}
        fontSizeInput={fontSizeInput}
        setFontSizeInput={setFontSizeInput}
      />
      {showColorPicker && (
        <div className="color-palette">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
          />
          <button onClick={changeColor}>Apply Color</button>
        </div>
      )}
      {showFontStylePicker && (
        <div className="font-style-picker">
          {['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'].map(fontStyle => (
            <button key={fontStyle} onClick={() => changeFontStyle(fontStyle)}>
              {fontStyle}
            </button>
          ))}
        </div>
      )}
      <div className="editor-area" ref={editorRef}>
        {texts.map(text => (
          <div
            key={text.id}
            className={`text-element ${selectedTextId === text.id ? 'selected' : ''}`}
            style={{
              color: text.color,
              transform: `rotate(${text.rotation}deg)`,
              position: 'absolute',
              left: `${text.x}px`,
              top: `${text.y}px`,
              width: `${text.width}px`,
              height: `${text.height}px`,
              fontFamily: text.fontStyle,
            }}
          >
            <div
              className="drag-handle"
              onMouseDown={(e) => handleDragStart(text.id, e)}
            />
            <textarea
              value={text.content}
              onChange={(e) => handleTextChange(text.id, e.target.value)}
              onClick={() => handleTextClick(text.id)}
              style={{
                fontSize: `${text.fontSize}px`,
                lineHeight: '1',
              }}
            />
            <div 
              className="rotation-handle"
              onMouseDown={(e) => handleRotationStart(text.id, e)}
            >↻</div>
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
              <div
                key={corner}
                className={`resize-handle ${corner}`}
                onMouseDown={(e) => handleResizeStart(text.id, corner, e)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TextEditor;
