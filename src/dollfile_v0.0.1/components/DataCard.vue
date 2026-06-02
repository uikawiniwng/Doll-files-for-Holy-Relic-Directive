<template>
  <article class="data-card">
    <!-- Cyber decoration lines -->
    <div class="card-dec-top"></div>
    <div class="card-dec-left"></div>

    <div class="card-header">
      <h3 class="card-title">{{ title }}</h3>
      <span v-if="level" class="card-level">{{ level }}</span>
    </div>

    <div class="card-body">
      <slot></slot>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.data-card {
  --card-bg: rgba(9, 13, 20, 0.6);
  --card-border: rgba(0, 161, 183, 0.3);
  --card-glow: rgba(0, 161, 183, 0.1);
  --clip-size: 12px;

  position: relative;
  padding: 16px;
  margin-bottom: 16px;
  background: var(--card-bg);
  border: 1px solid transparent;

  /* Cyberpunk cut corner top-right and bottom-left */
  clip-path: polygon(
    0 0,
    calc(100% - var(--clip-size)) 0,
    100% var(--clip-size),
    100% 100%,
    var(--clip-size) 100%,
    0 calc(100% - var(--clip-size))
  );

  /* Simulate borders with inset shadow since clip-path cuts actual borders */
  box-shadow:
    inset 0 0 0 1px var(--card-border),
    inset 0 0 15px var(--card-glow);
  transition: all 0.3s ease;
}

.data-card:hover {
  --card-bg: rgba(9, 13, 20, 0.8);
  --card-border: rgba(0, 161, 183, 0.6);
  --card-glow: rgba(0, 161, 183, 0.2);
  transform: translateX(2px);
}

/* Decorative elements */
.card-dec-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background: #00a1b7;
}

.card-dec-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 20px;
  background: #00a1b7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
}

.card-title {
  margin: 0;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-shadow: 0 0 5px rgba(0, 161, 183, 0.5);
}

.card-level {
  color: #facc15; /* Warning/Rare yellow */
  font-size: 0.85rem;
  font-weight: 900;
  font-family: 'Consolas', monospace;
  padding: 2px 6px;
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  border-radius: 2px;
}

.card-body :deep(p) {
  margin: 6px 0;
  color: rgba(242, 245, 250, 0.85);
  line-height: 1.6;
  font-size: 0.9rem;
}

.card-body :deep(.card-label) {
  display: inline-block;
  min-width: 44px;
  margin-right: 8px;
  color: #00a1b7;
  font-weight: 800;
  font-size: 0.8rem;
}

/* List styling inside body */
.card-body :deep(.effect-list) {
  margin: 8px 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-body :deep(.effect-item) {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 2px solid rgba(0, 161, 183, 0.5);
}

.card-body :deep(.effect-name) {
  color: #00a1b7;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 2px 6px;
  background: rgba(0, 161, 183, 0.1);
  border: 1px solid rgba(0, 161, 183, 0.3);
}

.card-body :deep(.effect-text) {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);
}

.card-body :deep(.card-description) {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-style: italic;
  color: rgba(255, 255, 255, 0.5);
}
</style>
