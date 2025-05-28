
"use client";

import { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

// Global state to manage the script loading process
let scriptLoadingPromise: Promise<void> | null = null;
let globalMapsApiLoaded = !!(typeof window !== 'undefined' && window.google && window.google.maps);
let globalMapsApiError: Error | null = null;

// Unique callback name for this hook to avoid conflicts
const CALLBACK_NAME = '__initTicketopiaGoogleMapsApi';

export function useGoogleMapsApi() {
  // Local state for each hook instance, initialized from global status
  const [isLoaded, setIsLoaded] = useState(globalMapsApiLoaded);
  const [error, setError] = useState<Error | null>(globalMapsApiError);

  useEffect(() => {
    // If API is already loaded globally, update local state and exit
    if (globalMapsApiLoaded) {
      setIsLoaded(true);
      return;
    }
    // If API has already errored globally, update local state and exit
    if (globalMapsApiError) {
      setError(globalMapsApiError);
      return;
    }

    // Guard against SSR environments
    if (typeof window === 'undefined') {
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      const keyError = new Error("Google Maps API key is missing. Ensure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in your .env file.");
      // Set global error state to prevent repeated attempts by other hook instances
      if (!globalMapsApiError) globalMapsApiError = keyError; 
      console.error(keyError.message);
      setError(keyError);
      return;
    }

    // If scriptLoadingPromise doesn't exist, this is the first hook instance to initiate loading
    if (!scriptLoadingPromise) {
      scriptLoadingPromise = new Promise<void>((resolve, reject) => {
        // Define the global callback function if it hasn't been defined yet
        if (typeof (window as any)[CALLBACK_NAME] !== 'function') {
            (window as any)[CALLBACK_NAME] = () => {
                globalMapsApiLoaded = true; // Update global loaded status
                const scriptTag = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
                if (scriptTag) scriptTag.dataset.loaded = "true"; // Mark script as loaded
                resolve(); // Resolve the global promise
                delete (window as any)[CALLBACK_NAME]; // Clean up global callback
            };
        }

        const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

        if (existingScript) {
            if (existingScript.dataset.loaded === "true") {
                // If script is already marked as loaded, update global state and resolve
                if (!globalMapsApiLoaded) globalMapsApiLoaded = true;
                setIsLoaded(true);
                resolve();
                return;
            } else if (existingScript.dataset.error === "true") {
                // If script is marked as errored, update global error state and reject
                const prevError = new Error('Google Maps script previously failed to load. Check browser console for details.');
                if (!globalMapsApiError) globalMapsApiError = prevError;
                setError(prevError);
                reject(prevError);
                return;
            }
            // If script exists but its status is unknown, assume it's still loading.
            // The promise will be settled by its callback ((window as any)[CALLBACK_NAME]).
        } else {
            // Script does not exist, so create and append it
            const script = document.createElement('script');
            script.id = GOOGLE_MAPS_SCRIPT_ID;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,marker,places&callback=${CALLBACK_NAME}`;
            script.async = true; // Load asynchronously
            
            script.onerror = () => {
                const loadError = new Error('Failed to load Google Maps script. Check API key, network, and browser console for specific errors from Google.');
                // Update global error state
                if (!globalMapsApiError) globalMapsApiError = loadError;
                const scriptTag = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
                if (scriptTag) scriptTag.dataset.error = "true"; // Mark script as errored
                console.error(loadError.message);
                reject(loadError); // Reject the global promise
                delete (window as any)[CALLBACK_NAME]; // Clean up global callback
            };
            document.head.appendChild(script);
        }
      });
    }

    // All instances of the hook will tap into the same global promise
    scriptLoadingPromise
      .then(() => {
        setIsLoaded(true); // Update local state on successful load
        setError(null);     // Clear any previous error for this instance
      })
      .catch((err: Error) => {
        setError(err);     // Update local state on error
        setIsLoaded(false);
      });

  }, []); // Empty dependency array: effect runs once per component mount

  return { isLoaded, error };
}
