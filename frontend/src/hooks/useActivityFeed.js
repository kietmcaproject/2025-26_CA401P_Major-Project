import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

function maxByLength(list, maxLen) {
  if (list.length <= maxLen) return list;
  return list.slice(0, maxLen);
}

export function useActivityFeed({ maxItems = 25 } = {}) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    const onEvent = (evt) => {
      const type = evt?.type || "EVENT";
      const payload = evt?.payload || {};
      const createdAt = evt?.createdAt || new Date().toISOString();

      setItems((prev) => {
        const next = [
          {
            id: `${createdAt}-${type}-${Math.random().toString(16).slice(2)}`,
            type,
            payload,
            createdAt,
          },
          ...prev,
        ];
        return maxByLength(next, maxItems);
      });
    };

    socket.on("activity:event", onEvent);
    return () => {
      socket.off("activity:event", onEvent);
    };
  }, [maxItems]);

  return { items };
}

