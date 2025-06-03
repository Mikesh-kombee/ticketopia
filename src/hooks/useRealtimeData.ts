import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  Query,
  DocumentData,
} from "firebase/firestore";

export function useRealtimeData<T>(
  collectionName: string,
  options: {
    orderByField?: string;
    orderDirection?: "asc" | "desc";
    limit?: number;
  } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    try {
      const collectionRef = collection(db, collectionName);
      let q: Query<DocumentData> = collectionRef;

      if (options.orderByField) {
        q = query(
          q,
          orderBy(options.orderByField, options.orderDirection || "desc")
        );
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const newData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(newData);
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(`Error setting up ${collectionName} listener:`, err);
      setError(err as Error);
      setLoading(false);
    }
  }, [
    collectionName,
    options.orderByField,
    options.orderDirection,
    options.limit,
  ]);

  return { data, loading, error };
}
