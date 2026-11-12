import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationState {
  countryId: string | null;
  countryName: string | null;
  countryFlag: string | null;
  currency: string | null;
  regionId: string | null;
  regionName: string | null;
  districtId: string | null;
  districtName: string | null;
  lat: number | null;
  lng: number | null;
}

interface LocationContextType extends LocationState {
  setLocation: (loc: Partial<LocationState>) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

const LOCATION_KEY = 'osavdo_location';

const defaultState: LocationState = {
  countryId: null,
  countryName: null,
  countryFlag: null,
  currency: null,
  regionId: null,
  regionName: null,
  districtId: null,
  districtName: null,
  lat: null,
  lng: null,
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<LocationState>(defaultState);
  const revision = useRef(0);

  React.useEffect(() => {
    AsyncStorage.getItem(LOCATION_KEY).then((saved) => {
      if (!saved || revision.current !== 0) return;
      try {
        const stored = JSON.parse(saved) as Partial<LocationState>;
        setLocationState({ ...defaultState, ...stored });
      } catch {
        // Ignore a corrupted old location and continue with a clean state.
      }
    }).catch(() => {});
  }, []);

  const setLocation = useCallback((loc: Partial<LocationState>) => {
    revision.current += 1;
    setLocationState(prev => {
      const next = { ...prev, ...loc };
      AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearLocation = useCallback(() => {
    revision.current += 1;
    setLocationState(defaultState);
    AsyncStorage.removeItem(LOCATION_KEY).catch(() => {});
  }, []);

  return (
    <LocationContext.Provider value={{ ...location, setLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
}
