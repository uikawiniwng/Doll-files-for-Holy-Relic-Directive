<template>
  <aside class="hero-panel">
    <!-- Frame decorations -->
    <div class="frame-tl"></div>
    <div class="frame-tr"></div>
    <div class="frame-bl"></div>
    <div class="frame-br"></div>

    <div class="hero-kicker">
      <span>作战概览 / PROFILE</span>
      <div class="kicker-line"></div>
    </div>

    <div class="hero-main">
      <div class="hero-identity">
        <span class="hero-label">代号 CODE_NAME</span>
        <h1 class="hero-code">{{ codeText }}</h1>
      </div>

      <div class="hero-badges">
        <div class="cyber-badge rarity-badge">
          <small>稀有度 RARITY</small>
          <span>{{ rarityText }}</span>
        </div>
        <div class="cyber-badge style-badge">
          <small>职业 OCCUPATION</small>
          <span>{{ occupationText }}</span>
        </div>
      </div>
    </div>

    <!-- Navigation Menu (Moved from bottom to left panel) -->
    <nav class="side-nav desktop-only" aria-label="导航系统">
      <button
        v-for="nav in navItems"
        :key="nav.key"
        type="button"
        class="nav-item-cyber"
        :class="{ active: activePage === nav.key }"
        @click="$emit('update:activePage', nav.key)"
      >
        <span class="nav-decor-left"></span>
        <span class="nav-text">{{ nav.label }}</span>
        <span class="nav-decor-right"></span>
      </button>
    </nav>

    <div class="panel-bottom-actions">
      <div class="save-menu" @keydown.escape="showSaveMenu = false">
        <CyberButton
          variant="secondary"
          :disabled="importing"
          :aria-expanded="showSaveMenu"
          aria-haspopup="menu"
          @click="showSaveMenu = !showSaveMenu"
        >
          SAVE DATA
        </CyberButton>

        <transition name="glitch-fade">
          <div v-if="showSaveMenu" class="save-options" role="menu" aria-label="保存目标">
            <button
              type="button"
              class="save-option"
              role="menuitem"
              :disabled="importing"
              @click="selectSaveTarget('worldbook')"
            >
              <span class="save-option-title">聊天世界书</span>
              <span class="save-option-sub">SAVE IN CHAT LOREBOOK</span>
            </button>
            <button
              type="button"
              class="save-option"
              role="menuitem"
              :disabled="importing"
              @click="selectSaveTarget('mvu')"
            >
              <span class="save-option-title">MVU 变量</span>
              <span class="save-option-sub">SAVE IN MVU VARIABLE</span>
            </button>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CyberButton from './CyberButton.vue';

defineProps({
  codeText: { type: String, default: 'Unknown' },
  rarityText: { type: String, default: 'C' },
  occupationText: { type: String, default: '-' },
  activePage: { type: String, default: 'status' },
  navItems: { type: Array as () => Array<{ key: string; label: string }>, default: () => [] },
  importing: { type: Boolean, default: false },
});

const emit = defineEmits(['update:activePage', 'importWorldbook', 'importMvu']);

const showSaveMenu = ref(false);

function selectSaveTarget(target: 'worldbook' | 'mvu') {
  showSaveMenu.value = false;
  if (target === 'worldbook') {
    emit('importWorldbook');
    return;
  }
  emit('importMvu');
}
</script>

<style scoped>
.hero-panel {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: linear-gradient(135deg, rgba(0, 161, 183, 0.05), transparent 40%), rgba(5, 6, 9, 0.7);
  border-right: 1px solid rgba(0, 161, 183, 0.2);
  z-index: 10;
}

/* Frame decorations */
.frame-tl,
.frame-tr,
.frame-bl,
.frame-br {
  position: absolute;
  width: 15px;
  height: 15px;
  border-color: #00a1b7;
  border-style: solid;
  opacity: 0.7;
}

.frame-tl {
  top: 10px;
  left: 10px;
  border-width: 2px 0 0 2px;
}
.frame-tr {
  top: 10px;
  right: 10px;
  border-width: 2px 2px 0 0;
}
.frame-bl {
  bottom: 10px;
  left: 10px;
  border-width: 0 0 2px 2px;
}
.frame-br {
  bottom: 10px;
  right: 10px;
  border-width: 0 2px 2px 0;
}

.hero-kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  color: #00a1b7;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 2px;
  flex-shrink: 0;
}

.kicker-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 161, 183, 0.5), transparent);
}

.hero-main {
  margin-bottom: 32px;
  flex-shrink: 0;
}

.hero-label {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.65rem;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.hero-code {
  margin: 0 0 20px;
  color: #fff;
  font-size: 2.8rem;
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(0, 161, 183, 0.3);
  word-break: break-all;
}

.hero-badges {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cyber-badge {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  border-left: 3px solid #00a1b7;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
}

.cyber-badge small {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.65rem;
  font-weight: 700;
}

.cyber-badge span {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 800;
}

.rarity-badge {
  border-left-color: #facc15;
}
.rarity-badge span {
  color: #facc15;
  font-family: 'Consolas', monospace;
  font-size: 1.1rem;
}

/* Side Navigation */
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  margin-bottom: auto;
  overflow-y: auto;
  padding-right: 4px;
}

.side-nav::-webkit-scrollbar {
  width: 2px;
}
.side-nav::-webkit-scrollbar-thumb {
  background: rgba(0, 161, 183, 0.3);
}

.nav-item-cyber {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: rgba(0, 161, 183, 0.05);
  border: 1px solid rgba(0, 161, 183, 0.1);
  color: rgba(0, 161, 183, 0.6);
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 1px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

.nav-decor-left {
  width: 4px;
  height: 12px;
  background: transparent;
  transition: all 0.3s;
}

.nav-decor-right {
  width: 20px;
  height: 2px;
  background: transparent;
  transition: all 0.3s;
}

.nav-item-cyber:hover {
  background: rgba(0, 161, 183, 0.15);
  color: rgba(0, 161, 183, 0.9);
  border-color: rgba(0, 161, 183, 0.3);
  padding-left: 20px;
}

.nav-item-cyber.active {
  background: rgba(0, 161, 183, 0.2);
  color: #fff;
  border-color: #00a1b7;
  text-shadow: 0 0 5px rgba(0, 161, 183, 0.5);
  box-shadow: inset 0 0 15px rgba(0, 161, 183, 0.2);
}

.nav-item-cyber.active .nav-decor-left {
  background: #00a1b7;
  box-shadow: 0 0 8px #00a1b7;
}

.nav-item-cyber.active .nav-decor-right {
  background: #00a1b7;
}

.panel-bottom-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.save-menu {
  position: relative;
  width: 100%;
}

.save-menu > *:first-child {
  width: 100%;
}

.save-options {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 10px);
  z-index: 30;
  padding: 8px;
  background: rgba(5, 6, 9, 0.96);
  border: 1px solid rgba(250, 204, 21, 0.45);
  box-shadow:
    0 0 22px rgba(250, 204, 21, 0.16),
    inset 0 0 12px rgba(0, 161, 183, 0.08);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.save-option {
  width: 100%;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  text-align: left;
  outline: none;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    padding-left 0.2s ease;
}

.save-option + .save-option {
  border-top: 1px solid rgba(0, 161, 183, 0.16);
}

.save-option:hover,
.save-option:focus-visible {
  padding-left: 16px;
  background: rgba(250, 204, 21, 0.12);
  color: #fff;
}

.save-option:disabled {
  cursor: wait;
  opacity: 0.55;
}

.save-option-title {
  font-size: 0.82rem;
  font-weight: 900;
}

.save-option-sub {
  color: #facc15;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 1px;
}

.glitch-fade-enter-active,
.glitch-fade-leave-active {
  transition: all 0.2s ease;
}

.glitch-fade-enter-from,
.glitch-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 800px) {
  .desktop-only {
    display: none !important;
  }

  .hero-panel {
    height: auto;
    min-height: 0;
    padding: 18px 22px 20px;
  }

  .frame-tl,
  .frame-tr,
  .frame-bl,
  .frame-br {
    width: 14px;
    height: 14px;
  }

  .hero-kicker {
    margin-bottom: 16px;
    font-size: 0.68rem;
    letter-spacing: 1.8px;
  }

  .hero-main {
    margin-bottom: 20px;
  }

  .hero-code {
    margin-bottom: 18px;
    font-size: clamp(2.1rem, 11vw, 2.75rem);
    line-height: 1;
  }

  .hero-badges {
    gap: 10px;
  }

  .cyber-badge {
    min-height: 38px;
    padding: 7px 12px;
  }

  .panel-bottom-actions {
    margin-top: 18px;
  }

  .save-options {
    bottom: auto;
    top: calc(100% + 10px);
  }
}
</style>
