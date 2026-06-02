<template>
  <button :class="['cyber-btn', variant]" :disabled="disabled" @click="$emit('click', $event)">
    <span class="cyber-btn-text"><slot></slot></span>
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary', // 'primary', 'secondary', 'ghost'
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>

<style scoped>
.cyber-btn {
  --btn-color: #00a1b7; /* Cyberpunk cyan */
  --btn-bg: rgba(0, 161, 183, 0.1);
  --btn-hover-color: #050609;
  --btn-hover-bg: #00a1b7;
  --clip-size: 8px;

  position: relative;
  min-width: 80px;
  height: 38px;
  padding: 0 16px;
  background: var(--btn-bg);
  border: none; /* Use clip-path or inset shadow instead of standard borders for a cleaner tech look */
  color: var(--btn-color);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  outline: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  /* Cyberpunk cut corner */
  clip-path: polygon(
    0 var(--clip-size),
    var(--clip-size) 0,
    100% 0,
    100% calc(100% - var(--clip-size)),
    calc(100% - var(--clip-size)) 100%,
    0 100%
  );

  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Simulate border using pseudo element to allow transparency inside the clip path */
.cyber-btn::before {
  content: '';
  position: absolute;
  inset: 1px;
  background: rgba(5, 6, 9, 0.8);
  clip-path: polygon(
    0 var(--clip-size),
    var(--clip-size) 0,
    100% 0,
    100% calc(100% - var(--clip-size)),
    calc(100% - var(--clip-size)) 100%,
    0 100%
  );
  z-index: 0;
  transition: all 0.3s ease;
}

.cyber-btn-text {
  position: relative;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Hover effects */
.cyber-btn:hover:not(:disabled) {
  background: var(--btn-hover-bg);
  color: var(--btn-hover-color);
  box-shadow: 0 0 15px rgba(0, 161, 183, 0.5);
}

.cyber-btn:hover:not(:disabled)::before {
  background: transparent;
}

/* Active effects */
.cyber-btn:active:not(:disabled) {
  transform: scale(0.96);
  filter: brightness(0.8);
}

/* Disabled state */
.cyber-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

/* Variants */
.cyber-btn.primary {
  --btn-color: #149cea;
  --btn-bg: rgba(20, 156, 234, 0.2);
  --btn-hover-bg: #149cea;
}

.cyber-btn.secondary {
  --btn-color: #facc15; /* Rarity yellow as secondary */
  --btn-bg: rgba(250, 204, 21, 0.15);
  --btn-hover-bg: #facc15;
}

.cyber-btn.danger {
  --btn-color: #ff3366;
  --btn-bg: rgba(255, 51, 102, 0.15);
  --btn-hover-bg: #ff3366;
}

/* Optional glitch effect on hover */
@keyframes btn-glitch {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 1px);
  }
  40% {
    transform: translate(-1px, -1px);
  }
  60% {
    transform: translate(2px, 1px);
  }
  80% {
    transform: translate(1px, -1px);
  }
  100% {
    transform: translate(0);
  }
}

.cyber-btn:hover:not(:disabled) .cyber-btn-text {
  animation: btn-glitch 0.2s linear;
}
</style>
