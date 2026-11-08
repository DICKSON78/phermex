import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { formatNumber, formatPercent } from './ManufacturerUI'

// Approximate centres for the regions that appear in pharmacy addresses.
// Anything unknown is placed around the centre of the country so the map still
// renders instead of dropping the data point.
const REGION_COORDS = {
  'dar es salaam': [-6.79, 39.21],
  mwanza: [-2.52, 32.9],
  arusha: [-3.37, 36.68],
  dodoma: [-6.16, 35.75],
  mbeya: [-8.9, 33.46],
  morogoro: [-6.82, 37.66],
  tanga: [-5.07, 39.1],
  kilimanjaro: [-3.36, 37.34],
  kigoma: [-4.88, 29.66],
  tabora: [-5.02, 32.8],
  iringa: [-7.77, 35.69],
  kagera: [-1.9, 31.43],
  mara: [-1.78, 33.98],
  geita: [-2.87, 32.23],
  songwe: [-8.94, 32.93],
  ruvuma: [-10.69, 35.65],
  lindi: [-9.99, 39.71],
  mtwara: [-10.27, 40.18],
  pwani: [-6.9, 38.68],
  singida: [-4.82, 34.75],
  shinyanga: [-3.66, 33.42],
  simiyu: [-2.86, 34.05],
  katavi: [-6.42, 31.28],
  rukwa: [-8.02, 31.42],
  njombe: [-9.33, 34.77],
  manyara: [-4.32, 36.68],
  kaskazini: [-1.5, 34.9],
  kusini: [-6.2, 39.3],
  'zanzibar urban/west': [-6.16, 39.19],
  'zanzibar north': [-5.95, 39.3],
  'zanzibar south': [-6.3, 39.35],
  pemba: [-5.15, 39.75],
}

function normalise(name) {
  return String(name || '').toLowerCase().replace(/\s*region$/, '').trim()
}

function coordsFor(region, index) {
  const match = REGION_COORDS[normalise(region)]
  if (match) return match
  // Deterministic spread so unknown regions do not stack on one point.
  const angle = (index * 137.5 * Math.PI) / 180
  const radius = 0.7 + (index % 4) * 0.55
  return [-6.3 + Math.cos(angle) * radius, 34.8 + Math.sin(angle) * radius]
}

export default function ManufacturerRegionMap({ regions = [] }) {
  const maxUnits = Math.max(1, ...regions.map((region) => Number(region.units || 0)))

  return (
    <div className="helix-region-map h-[280px] w-full overflow-hidden rounded-xl border border-[#e3e9e4] bg-[#eef7f1]">
      <MapContainer
        center={[-6.3, 34.8]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        {/* CARTO's public basemaps now answer with an "API key required"
            watermark, so use OpenStreetMap's keyless tiles instead. The
            `helix-region-map` wrapper mutes their colours in index.css so the
            basemap still reads as background behind the demand bubbles. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {regions.slice(0, 14).map((region, index) => {
          const units = Number(region.units || 0)
          const radius = 7 + Math.sqrt(units / maxUnits) * 17
          const growth = Number(region.growth || 0)

          return (
            <CircleMarker
              key={`${region.region}-${units}-${index}`}
              center={coordsFor(region.region, index)}
              radius={radius}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: growth < 0 ? '#d97706' : '#16a34a',
                fillOpacity: 0.75,
              }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                <span className="text-xs font-semibold">{region.region}</span>
                <br />
                <span className="text-xs">
                  {formatNumber(units)} units · {formatPercent(growth)}
                </span>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
