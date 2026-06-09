"use client";

import { createContext, useContext, useState } from "react";

/**
 * Global drag-and-drop store for SperoFlow.
 *
 * Provides a lightweight React Context to share the currently
 * dragged item's metadata across any component in the tree —
 * used by DndProvider to render the DragOverlay and route
 * drag-end events to the correct feature handler.
 */

const DragStoreContext = createContext(null);

export function DragStoreProvider({ children }) {
  const [activeItem, setActiveItem] = useState(null);

  function startDrag(item) {
    setActiveItem(item);
  }

  function endDrag() {
    setActiveItem(null);
  }

  return (
    <DragStoreContext.Provider value={{ activeItem, startDrag, endDrag }}>
      {children}
    </DragStoreContext.Provider>
  );
}

export function useDragStore() {
  const ctx = useContext(DragStoreContext);
  if (!ctx) throw new Error("useDragStore must be used inside <DragStoreProvider>");
  return ctx;
}
