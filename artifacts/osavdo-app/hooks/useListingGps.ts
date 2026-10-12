import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as ExpoLocation from 'expo-location';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDetectLocation, getRegions, getDistricts,
  getGetRegionsQueryKey, getGetDistrictsQueryKey,
} from '@workspace/api-client-react';

export interface ListingLocationValue {
  regionId: string;
  districtId: string;
  countryId?: string;
}

// GPS is an explicit one-time action. It never writes the account or browse location.
export function useListingGps(onChange: (value: ListingLocationValue) => void) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRef(0);
  const queryClient = useQueryClient();
  const { mutateAsync } = useDetectLocation();
  useEffect(() => () => { request.current++; }, []);

  const cancel = useCallback(() => {
    request.current++;
    setBusy(false);
    setNotice('');
  }, []);

  const start = useCallback(async () => {
    const id = ++request.current;
    setBusy(true);
    setNotice('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const locate = async () => {
        let coords: { latitude: number; longitude: number };
        if (Platform.OS === 'web') {
          coords = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
              reject(new Error('GPS_UNAVAILABLE'));
              return;
            }
            navigator.geolocation.getCurrentPosition(
              position => resolve(position.coords),
              error => reject(new Error(error.code === 1 ? 'GPS_PERMISSION_DENIED' : 'GPS_UNAVAILABLE')),
              { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 },
            );
          });
        } else {
          const permission = await ExpoLocation.requestForegroundPermissionsAsync();
          if (!permission.granted) throw new Error('GPS_PERMISSION_DENIED');
          coords = (await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })).coords;
        }
        // Do not call the detector after the user has switched back to manual entry.
        if (request.current !== id) return null;
        const detected = await mutateAsync({ data: { lat: coords.latitude, lng: coords.longitude } });
        if (request.current !== id) return null;
        const [regions, districts] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: getGetRegionsQueryKey({ countryId: detected.countryId }),
            queryFn: () => getRegions({ countryId: detected.countryId }),
          }),
          queryClient.fetchQuery({
            queryKey: getGetDistrictsQueryKey({ regionId: detected.regionId }),
            queryFn: () => getDistricts({ regionId: detected.regionId }),
          }),
        ]);
        const region = regions.find(item => item.id === detected.regionId && item.countryId === detected.countryId);
        if (!region) throw new Error('GPS_INVALID_REGION');
        const district = districts.find(item => item.id === detected.districtId && item.regionId === region.id);
        return { detected, region, district };
      };
      const result = await Promise.race([
        locate(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('GPS_TIMEOUT')), 20_000); }),
      ]);
      if (request.current !== id || !result) return;
      onChange({
        countryId: result.detected.countryId,
        regionId: result.region.id,
        districtId: result.district?.id ?? '',
      });
      setNotice(result.district
        ? `GPS: ${result.detected.countryName}. Viloyat va tumanni tekshiring; kerak bo‘lsa qo‘lda tuzating.`
        : 'GPS viloyatni aniqladi. Tumanni qo‘lda tanlang.');
    } catch (error) {
      if (request.current !== id) return;
      setNotice(error instanceof Error && error.message === 'GPS_PERMISSION_DENIED'
        ? 'GPS ruxsati berilmadi. Viloyat va tumanni qo‘lda tanlashingiz mumkin.'
        : 'GPS orqali hudud aniqlanmadi. Qayta urining yoki viloyat va tumanni qo‘lda tanlang.');
    } finally {
      if (timer) clearTimeout(timer);
      if (request.current === id) setBusy(false);
    }
  }, [mutateAsync, onChange, queryClient]);

  return { start, cancel, busy, notice };
}
