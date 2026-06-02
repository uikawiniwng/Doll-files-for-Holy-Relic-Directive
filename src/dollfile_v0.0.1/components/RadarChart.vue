<template>
  <div class="radar-wrapper">
    <!-- Grid overlay mimicking scanning grid -->
    <div class="radar-scan-overlay"></div>

    <svg class="radar-svg" viewBox="-130 -130 260 260" aria-label="人形能力雷达图">
      <defs>
        <!-- Glow filter for the shape -->
        <filter id="cyber-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Background Grids (Hexagons) -->
      <polygon v-for="grid in radarGridPolygons" :key="grid.level" :points="grid.points" class="radar-grid" />

      <!-- Axes Lines -->
      <line v-for="axis in radarAxes" :key="axis.key" x1="0" y1="0" :x2="axis.x" :y2="axis.y" class="radar-axis" />

      <!-- Data Polygon with Glow -->
      <polygon :points="radarValuePoints" class="radar-shape" filter="url(#cyber-glow)" />

      <!-- Data Points -->
      <circle
        v-for="point in radarValuePointList"
        :key="point.key"
        :cx="point.x"
        :cy="point.y"
        r="4"
        class="radar-dot"
      />
    </svg>

    <!-- Labels placed precisely around the vertices -->
    <div
      v-for="label in radarLabels"
      :key="label.key"
      class="radar-label"
      :class="{ active: selectedAbilityKey === label.key }"
      :style="label.style"
      @mouseenter="$emit('select', label.key)"
    >
      <span class="label-name">{{ label.key }}</span>
      <span class="label-val">{{ label.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  abilities: {
    type: Array as () => Array<{ key: string; short: string; value: string; score: number }>,
    required: true,
  },
  selectedAbilityKey: {
    type: String,
    default: '',
  },
});

defineEmits(['select']);

const maxRadius = 90; // Slightly larger for better spacing
const labelRadius = 125; // Push labels further out

function polarPoint(index: number, radius: number): { x: number; y: number } {
  // -PI/2 is top center (12 o'clock). 6 abilities = PI/3 per step.
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function pointsToString(points: Array<{ x: number; y: number }>): string {
  return points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}

// Generate the 6 axes lines
const radarAxes = computed(() =>
  Array.from({ length: 6 }).map((_, index) => ({
    key: `axis-${index}`,
    ...polarPoint(index, maxRadius),
  })),
);

// Generate background grid polygons (25%, 50%, 75%, 100%)
const radarGridPolygons = computed(() =>
  [0.25, 0.5, 0.75, 1].map(level => ({
    level,
    points: pointsToString(Array.from({ length: 6 }).map((_, index) => polarPoint(index, maxRadius * level))),
  })),
);

// Calculate point coordinates for the actual data
const radarValuePointList = computed(() =>
  props.abilities.map((ability, index) => ({
    key: ability.key,
    ...polarPoint(index, (maxRadius * ability.score) / 100),
  })),
);

const radarValuePoints = computed(() => pointsToString(radarValuePointList.value));

// Calculate label positions
const radarLabels = computed(() =>
  props.abilities.map((ability, index) => {
    const point = polarPoint(index, labelRadius);

    // Determine alignment based on position
    let transform = 'translate(-50%, -50%)';
    if (point.x > 10) transform = 'translate(0%, -50%)';
    else if (point.x < -10) transform = 'translate(-100%, -50%)';

    if (point.y < -80) transform = 'translate(-50%, -100%)';
    else if (point.y > 80) transform = 'translate(-50%, 0%)';

    return {
      key: ability.key,
      value: ability.value,
      style: {
        left: `calc(50% + ${point.x}px)`,
        top: `calc(50% + ${point.y}px)`,
        transform,
      },
    };
  }),
);
</script>

<style scoped>
.radar-wrapper {
  position: relative;
  width: 100%;
  height: 380px; /* fixed height to ensure it fits perfectly in right panel */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Subtle scanning grid behind radar */
.radar-scan-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(0, 161, 183, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 161, 183, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: radial-gradient(circle, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(circle, black 30%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

.radar-svg {
  position: relative;
  width: 280px;
  height: 280px;
  overflow: visible;
  z-index: 1;
}

.radar-grid {
  fill: transparent;
  stroke: rgba(0, 161, 183, 0.15); /* Tech cyan grids */
  stroke-width: 1;
}

.radar-grid:last-of-type {
  stroke: rgba(0, 161, 183, 0.4); /* Outer rim slightly stronger */
}

.radar-axis {
  stroke: rgba(0, 161, 183, 0.2);
  stroke-dasharray: 2 4; /* dashed axes for cyber look */
  stroke-width: 1;
}

.radar-shape {
  fill: rgba(0, 161, 183, 0.25);
  stroke: #00a1b7;
  stroke-width: 2;
  transition: all 0.3s ease;
}

.radar-dot {
  fill: #fff;
  stroke: #00a1b7;
  stroke-width: 2;
  transition: all 0.3s ease;
}

/* Labels placed exactly at vertices */
.radar-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 2;
  pointer-events: auto;
  cursor: crosshair;
}

.label-name {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: color 0.2s;
  white-space: nowrap;
}

.label-val {
  color: #00a1b7;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 5px rgba(0, 161, 183, 0.4);
  transition: all 0.2s;
}

/* Hover / Active states */
.radar-label:hover .label-name,
.radar-label.active .label-name {
  color: #fff;
}

.radar-label:hover .label-val,
.radar-label.active .label-val {
  color: #fff;
  text-shadow:
    0 0 8px #00a1b7,
    0 0 12px #00a1b7;
  transform: scale(1.1);
}

@media (max-width: 800px) {
  .radar-wrapper {
    height: 320px;
  }

  .radar-svg {
    width: 230px;
    height: 230px;
  }

  .label-name {
    font-size: 0.68rem;
    letter-spacing: 0.5px;
  }

  .label-val {
    font-size: 1rem;
  }
}

@media (max-width: 380px) {
  .radar-wrapper {
    height: 300px;
  }

  .radar-svg {
    width: 214px;
    height: 214px;
  }
}
</style>
