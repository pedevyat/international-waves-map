import { memo, useCallback, useMemo, useState } from 'react'
import type { PathOptions } from 'leaflet'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { SiteGroup } from '../types'
import { SitePopup } from './SitePopup'

const APPROX_DASH = '3 2'

const ON_AIR: PathOptions = { color: '#0a7a38', weight: 1.5, fillColor: '#2ee077', fillOpacity: 1 }
const IDLE: PathOptions = { color: '#8a6400', weight: 1.5, fillColor: '#f6c21b', fillOpacity: 0.95 }
const ON_AIR_APPROX: PathOptions = { ...ON_AIR, dashArray: APPROX_DASH }
const IDLE_APPROX: PathOptions = { ...IDLE, dashArray: APPROX_DASH }

// «Свечение» — два полупрозрачных кольца под точкой
const halo = (color: string): [PathOptions, PathOptions] => [
  { stroke: false, fillColor: color, fillOpacity: 0.2 },
  { stroke: false, fillColor: color, fillOpacity: 0.35 },
]
const HALO_ON_AIR = halo('#2ee077')
const HALO_IDLE = halo('#f6c21b')

interface HaloProps {
  lat: number
  lon: number
  onAir: boolean
}

const Halo = memo(function Halo({ lat, lon, onAir }: HaloProps) {
  const [outer, inner] = onAir ? HALO_ON_AIR : HALO_IDLE
  return (
    <>
      <CircleMarker center={[lat, lon]} radius={16} interactive={false} pathOptions={outer} />
      <CircleMarker center={[lat, lon]} radius={10.5} interactive={false} pathOptions={inner} />
    </>
  )
})

interface DotProps {
  group: SiteGroup
  onAir: boolean
  onSelect: (key: string) => void
}

const Dot = memo(function Dot({ group, onAir, onSelect }: DotProps) {
  const style = group.approximate ? (onAir ? ON_AIR_APPROX : IDLE_APPROX) : onAir ? ON_AIR : IDLE
  return (
    <CircleMarker
      center={[group.lat, group.lon]}
      radius={6.5}
      pathOptions={style}
      eventHandlers={{ click: () => onSelect(group.key) }}
    />
  )
})

interface Props {
  groups: SiteGroup[]
  /** onAir[i] — есть ли в groups[i] передачи, идущие прямо сейчас. */
  onAir: boolean[]
  now: Date
}

export function EibiMap({ groups, onAir, now }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const select = useCallback((key: string) => setSelectedKey(key), [])

  const selected = useMemo(
    () => (selectedKey ? groups.find((g) => g.key === selectedKey) : undefined),
    [groups, selectedKey],
  )

  return (
    <MapContainer
      center={[35, 25]}
      zoom={3}
      minZoom={2}
      preferCanvas
      worldCopyJump
      zoomControl={false}
      className="map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {/* слева сверху теперь панель фильтра, поэтому кнопки масштаба внизу */}
      <ZoomControl position="bottomleft" />

      {/* Свечение: у станций в эфире, а у станций с неточными координатами — всегда.
          Сначала всё свечение, затем точки, чтобы кольца не перекрывали соседние точки. */}
      {groups.map((g, i) =>
        onAir[i] || g.approximate ? (
          <Halo key={`halo:${g.key}`} lat={g.lat} lon={g.lon} onAir={onAir[i]} />
        ) : null,
      )}
      {groups.map((g, i) => (
        <Dot key={g.key} group={g} onAir={onAir[i]} onSelect={select} />
      ))}

      {selected && (
        <Popup
          key={selected.key}
          position={[selected.lat, selected.lon]}
          minWidth={340}
          maxWidth={520}
          eventHandlers={{
            remove: () => setSelectedKey((cur) => (cur === selected.key ? null : cur)),
          }}
        >
          <SitePopup group={selected} now={now} />
        </Popup>
      )}
    </MapContainer>
  )
}