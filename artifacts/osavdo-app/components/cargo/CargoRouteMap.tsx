import React, { useMemo, useState } from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import type { CargoTracking } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

// Web Mercator tile coordinates; markers and tiles use the same geographic projection.
function project(lat: number, lng: number, zoom: number) {
  const latitude = Math.max(-85, Math.min(85, lat)) * Math.PI / 180;
  const size = 256 * 2 ** zoom;
  return {
    x: (lng + 180) / 360 * size,
    y: (1 - Math.log(Math.tan(latitude) + 1 / Math.cos(latitude)) / Math.PI) / 2 * size,
  };
}

export function CargoRouteMap({ tracking }: { tracking: CargoTracking }) {
  const colors = useColors();
  const [width, setWidth] = useState(320);
  const [tileError, setTileError] = useState(false);
  const height = 230;
  const map = useMemo(() => {
    const coordinates = [tracking.pickup, tracking.delivery];
    if (tracking.currentLat !== null && tracking.currentLng !== null) {
      coordinates.push({ lat: tracking.currentLat, lng: tracking.currentLng, label: 'GPS' });
    }
    let zoom = 12;
    for (; zoom > 1; zoom--) {
      const points = coordinates.map((point) => project(point.lat, point.lng, zoom));
      if (Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x)) < width - 70 &&
          Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y)) < height - 70) break;
    }
    const points = coordinates.map((point) => project(point.lat, point.lng, zoom));
    const centerX = (Math.max(...points.map(p => p.x)) + Math.min(...points.map(p => p.x))) / 2;
    const centerY = (Math.max(...points.map(p => p.y)) + Math.min(...points.map(p => p.y))) / 2;
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    const tiles = [];
    for (let y = Math.floor(top / 256); y <= Math.floor((top + height) / 256); y++) {
      for (let x = Math.floor(left / 256); x <= Math.floor((left + width) / 256); x++) {
        tiles.push({
          key: `${zoom}/${x}/${y}`,
          url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
          left: x * 256 - left,
          top: y * 256 - top,
        });
      }
    }
    return { tiles, points: points.map(point => ({ x: point.x - left, y: point.y - top })) };
  }, [tracking, width]);

  return (
    <View
      testID="cargo-route-map"
      style={[styles.map, { backgroundColor: colors.muted }]}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
    >
      {map.tiles.map(tile => (
        <Image
          key={tile.key}
          source={{ uri: tile.url }}
          style={{ position: 'absolute', left: tile.left, top: tile.top, width: 256, height: 256 }}
          onError={() => setTileError(true)}
        />
      ))}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Line
          x1={map.points[0]!.x} y1={map.points[0]!.y}
          x2={map.points[1]!.x} y2={map.points[1]!.y}
          stroke={colors.primary} strokeWidth={3} strokeDasharray="7 5"
        />
        {map.points.map((point, index) => (
          <Circle
            key={index} cx={point.x} cy={point.y} r={index === 2 ? 7 : 9}
            fill={index === 0 ? colors.statusConfirmed : colors.primary}
            stroke={colors.card} strokeWidth={3}
          />
        ))}
        <SvgText x={map.points[0]!.x} y={map.points[0]!.y - 14} fill={colors.text} fontSize={13} fontWeight="bold" textAnchor="middle">A</SvgText>
        <SvgText x={map.points[1]!.x} y={map.points[1]!.y - 14} fill={colors.text} fontSize={13} fontWeight="bold" textAnchor="middle">B</SvgText>
      </Svg>
      <View style={[styles.legend, { backgroundColor: colors.card }]}>
        <Text style={[styles.caption, { color: colors.text }]}>A: Yuklash · B: Yetkazish</Text>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          {tileError ? 'Xarita rasmlari yuklanmadi' : 'Tuman markazlari · chiziq avtomobil yo‘li emas'}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityLabel="OpenStreetMap xaritasini ochish"
        style={[styles.attribution, { backgroundColor: colors.card }]}
        onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${tracking.pickup.lat}&mlon=${tracking.pickup.lng}#map=8/${tracking.pickup.lat}/${tracking.pickup.lng}`)}
      >
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>© OpenStreetMap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 230, borderRadius: 14, overflow: 'hidden' },
  legend: { position: 'absolute', left: 8, top: 8, padding: 7, borderRadius: 6, gap: 2 },
  attribution: { position: 'absolute', right: 4, bottom: 4, paddingHorizontal: 5, paddingVertical: 3 },
  caption: { fontSize: 10, fontFamily: 'Inter_500Medium' },
});
