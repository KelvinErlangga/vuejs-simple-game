<template>
  <div class="mobile-hud" v-if="isMobile">
    <!-- Top Bar -->
    <div class="mobile-top-bar">
      <!-- Health & Stamina -->
      <div class="mobile-stats-left">
        <div class="mobile-health-bar">
          <div class="mobile-health-fill" :style="{ width: player.health + '%' }"></div>
          <span class="mobile-health-text">❤️ {{ Math.ceil(player.health) }}</span>
        </div>
        <div class="mobile-stamina-bar">
          <div class="mobile-stamina-fill" :style="{ width: player.stamina + '%' }"></div>
          <span class="mobile-stamina-text">⚡ {{ Math.ceil(player.stamina) }}</span>
        </div>
      </div>
      
      <!-- Level & XP -->
      <div class="mobile-level-info">
        <div class="mobile-level">Lv.{{ player.level }}</div>
        <div class="mobile-xp-bar">
          <div class="mobile-xp-fill" :style="{ width: (player.xp % 100) + '%' }"></div>
        </div>
      </div>
      
      <!-- Quick Inventory -->
      <div class="mobile-quick-inventory">
        <div 
          v-for="(slot, index) in quickSlots.slice(0, 3)" 
          :key="index"
          class="mobile-quick-slot"
          :class="{ active: selectedQuickSlot === index, empty: !slot.item }"
          @click="$emit('selectQuickSlot', index)"
        >
          <span v-if="slot.item" class="mobile-slot-icon">{{ slot.item.icon }}</span>
          <span v-else class="mobile-slot-number">{{ index + 1 }}</span>
        </div>
      </div>
    </div>
    
    <!-- Status Effects -->
    <div class="mobile-status-effects" v-if="activeStatusEffects.length > 0">
      <div 
        v-for="effect in activeStatusEffects" 
        :key="effect.id"
        class="mobile-status-effect"
      >
        <span class="mobile-effect-icon">{{ effect.icon }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MobileHud',
  props: {
    isMobile: Boolean,
    player: Object,
    quickSlots: Array,
    selectedQuickSlot: Number,
    activeStatusEffects: Array
  },
  emits: ['selectQuickSlot']
}
</script>

<style scoped>
/* ==========================================
   MOBILE HUD (COMPLETELY SEPARATED)
   ========================================== */
.mobile-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  pointer-events: none;
}

.mobile-hud > * {
  pointer-events: auto;
}

.mobile-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%);
  border-bottom: 2px solid rgba(255,255,255,0.2);
}

.mobile-stats-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.mobile-health-bar,
.mobile-stamina-bar {
  position: relative;
  height: 20px;
  background: rgba(0,0,0,0.6);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.3);
}

.mobile-health-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #cc0000);
  transition: width 0.3s ease;
}

.mobile-stamina-fill {
  height: 100%;
  background: linear-gradient(90deg, #4444ff, #0000cc);
  transition: width 0.3s ease;
}

.mobile-health-text,
.mobile-stamina-text {
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  color: white;
  font-size: 11px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  white-space: nowrap;
}

.mobile-level-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 0 10px;
}

.mobile-level {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.mobile-xp-bar {
  width: 60px;
  height: 6px;
  background: rgba(0,0,0,0.6);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.3);
}

.mobile-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffaa00, #ff6600);
  transition: width 0.3s ease;
}

.mobile-quick-inventory {
  display: flex;
  gap: 8px;
}

.mobile-quick-slot {
  width: 40px;
  height: 40px;
  background: rgba(0,0,0,0.6);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-quick-slot.active {
  border-color: #4CAF50;
  background: rgba(76,175,80,0.3);
  box-shadow: 0 0 10px rgba(76,175,80,0.5);
}

.mobile-quick-slot.empty {
  opacity: 0.7;
}

.mobile-slot-icon {
  font-size: 18px;
}

.mobile-slot-number {
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: bold;
}

.mobile-status-effects {
  position: absolute;
  top: 80px;
  left: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  max-width: calc(100% - 20px);
}

.mobile-status-effect {
  width: 30px;
  height: 30px;
  background: rgba(0,0,0,0.7);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

.mobile-effect-icon {
  font-size: 16px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* ==========================================
   ORIENTATION SPECIFIC STYLES
   ========================================== */
@media (orientation: landscape) {
  .mobile-top-bar {
    padding: 8px;
  }
  
  .mobile-health-bar,
  .mobile-stamina-bar {
    height: 16px;
  }
  
  .mobile-health-text,
  .mobile-stamina-text {
    font-size: 10px;
  }
  
  .mobile-level {
    font-size: 12px;
  }
  
  .mobile-quick-slot {
    width: 35px;
    height: 35px;
  }
  
  .mobile-slot-icon {
    font-size: 16px;
  }
}

@media (orientation: portrait) {
  .mobile-top-bar {
    padding: 12px;
  }
  
  .mobile-health-bar,
  .mobile-stamina-bar {
    height: 24px;
  }
  
  .mobile-health-text,
  .mobile-stamina-text {
    font-size: 12px;
  }
  
  .mobile-level {
    font-size: 16px;
  }
  
  .mobile-quick-slot {
    width: 45px;
    height: 45px;
  }
  
  .mobile-slot-icon {
    font-size: 20px;
  }
}
</style>
