import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationState {
  regionId: string | null;
  regionName: string | null;
  districtId: string | null;
  districtName: string | null;
  lat: number | null;
  lng: number | null;
}

interface LocationContextType extends LocationState {
  setLocation: (loc: LocationState) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

const LOCATION_KEY = 'osavdo_location';

const defaultState: LocationState = {
  regionId: null,
  regionName: null,
  districtId: null,
  districtName: null,
  lat: null,
  lng: null,
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<LocationState>(defaultState);

  const setLocation = useCallback((loc: LocationState) => {
    setLocationState(loc);
    AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc)).catch(() => {});
  }, []);

  const clearLocation = useCallback(() => {
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
