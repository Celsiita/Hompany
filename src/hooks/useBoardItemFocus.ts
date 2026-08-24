import { useCallback, useEffect, useRef, useState } from 'react';

const HIGHLIGHT_MS = 4500;

type UseBoardItemFocusOptions<T extends { id: string }> = {
  /** focusId from the URL (calendar, deep link, etc.). */
  routeFocusId?: string;
  isLoading: boolean;
  findItem: (id: string) => T | undefined;
  /** Prepare UI (section, filters) before highlighting. */
  onFocus: (item: T) => void;
  /** Clear the route param after handling. */
  clearRouteParam: () => void;
};

type UseBoardItemFocusResult = {
  highlightedId: string | null;
  /** Focus an item already on this screen (e.g. after create). */
  requestFocus: (id: string) => void;
};

/**
 * Resolves route or local focus requests into a temporary list highlight.
 * Highlight always clears after HIGHLIGHT_MS even if focus deps change.
 */
export function useBoardItemFocus<T extends { id: string }>(
  options: UseBoardItemFocusOptions<T>,
): UseBoardItemFocusResult {
  const { routeFocusId, isLoading, findItem, onFocus, clearRouteParam } = options;
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const handledRef = useRef<string | null>(null);
  const onFocusRef = useRef(onFocus);
  const findItemRef = useRef(findItem);
  const clearRouteParamRef = useRef(clearRouteParam);

  onFocusRef.current = onFocus;
  findItemRef.current = findItem;
  clearRouteParamRef.current = clearRouteParam;

  const activeId = routeFocusId ?? pendingId ?? undefined;

  useEffect(() => {
    if (routeFocusId) {
      handledRef.current = null;
    }
  }, [routeFocusId]);

  useEffect(() => {
    if (!activeId || isLoading) {
      return;
    }
    if (handledRef.current === activeId) {
      return;
    }
    const item = findItemRef.current(activeId);
    if (!item) {
      return;
    }

    handledRef.current = activeId;
    onFocusRef.current(item);
    setHighlightedId(item.id);
    setPendingId(null);
    if (routeFocusId) {
      clearRouteParamRef.current();
    }
  }, [activeId, isLoading, routeFocusId]);

  useEffect(() => {
    if (!highlightedId) {
      return;
    }
    const timer = setTimeout(() => {
      setHighlightedId((current) => (current === highlightedId ? null : current));
    }, HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  const requestFocus = useCallback((id: string) => {
    handledRef.current = null;
    setPendingId(id);
  }, []);

  return { highlightedId, requestFocus };
}
