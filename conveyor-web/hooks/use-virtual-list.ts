import { useEffect, useRef, useState } from "react";

export interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualListResult {
  virtualItems: Array<{
    index: number;
    start: number;
    size: number;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for virtualizing large lists to improve performance
 * Only renders visible items + overscan buffer
 *
 * @example
 * const { virtualItems, totalHeight, containerRef } = useVirtualList({
 *   itemHeight: 50,
 *   containerHeight: 400,
 *   overscan: 5
 * });
 *
 * <div ref={containerRef} style={{ height: containerHeight, overflow: 'auto' }}>
 *   <div style={{ height: totalHeight, position: 'relative' }}>
 *     {virtualItems.map(item => (
 *       <div key={item.index} style={{ position: 'absolute', top: item.start }}>
 *         {data[item.index]}
 *       </div>
 *     ))}
 *   </div>
 * </div>
 */
export function useVirtualList(
  itemCount: number,
  options: UseVirtualListOptions
): VirtualListResult {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = itemCount * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // Generate virtual items
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: i * itemHeight,
      size: itemHeight,
    });
  }

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  };

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerRef,
  };
}
