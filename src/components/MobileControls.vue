<template>
  <div class="mobile-controls" v-if="isMobile">
    <!-- Joystick Kiri -->
    <div class="joystick-container left">
      <div 
        class="joystick-base"
        ref="joystickBase"
        @touchstart="$emit('startJoystick', $event)"
        @touchmove="$emit('updateJoystick', $event)"
        @touchend="$emit('endJoystick')"
      >
        <div 
          class="joystick-thumb"
          :style="{
            transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`
          }"
        ></div>
      </div>
    </div>

    <!-- Action Buttons Kanan -->
    <div class="mobile-actions">
      <div class="mobile-action-row">
        <button 
          class="mobile-btn attack"
          @touchstart.prevent="$emit('performAction', 'attack')"
        >
          ⚔️
        </button>
        <button 
          class="mobile-btn block"
          @touchstart.prevent="$emit('startBlocking')"
          @touchend.prevent="$emit('stopBlocking')"
        >
          🛡️
        </button>
      </div>
      <div class="mobile-action-row">
        <button 
          class="mobile-btn dash"
          @touchstart.prevent="$emit('performAction', 'dash')"
        >
          💨
        </button>
        <button 
          class="mobile-btn use"
          @touchstart.prevent="$emit('useSelectedItem')"
        >
          🫴
        </button>
      </div>
      <div class="mobile-action-row">
        <button 
          class="mobile-btn menu"
          @click="$emit('toggleMobileMenu')"
        >
          ☰
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MobileControls',
  props: {
    isMobile: Boolean,
    joystickPosition: Object
  },
  emits: [
    'startJoystick',
    'updateJoystick', 
    'endJoystick',
    'performAction',
    'startBlocking',
    'stopBlocking',
    'useSelectedItem',
    'toggleMobileMenu'
  ]
}
</script>

<style scoped>
/* ==========================================
   MOBILE CONTROLS
   ========================================== */
.mobile-controls {
  position: absolute;
  bottom: 220px;
  left: 0;
  right: 0;
  height: 160px;
  z-index: 150;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%);
}

.mobile-controls > * {
  pointer-events: auto;
}

.joystick-container {
  position: relative;
  width: 140px;
  height: 140px;
}

.joystick-base {
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  border: 4px solid rgba(255,255,255,0.5);
  border-radius: 50%;
  position: relative;
  touch-action: none;
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
}

.joystick-thumb {
  width: 60px;
  height: 60px;
  background: rgba(255,255,255,0.95);
  border: 3px solid rgba(255,255,255,0.7);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.mobile-actions {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 15px;
  width: 200px;
  height: 160px;
}

.mobile-action-row {
  display: contents;
}

.mobile-btn {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: none;
  font-size: 32px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 6px 16px rgba(0,0,0,0.5);
  touch-action: manipulation;
}

.mobile-btn:active {
  transform: scale(0.85);
  box-shadow: 0 3px 8px rgba(0,0,0,0.4);
}

.mobile-btn.attack {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  color: white;
  grid-column: 1;
  grid-row: 1;
}

.mobile-btn.block {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  grid-column: 2;
  grid-row: 1;
}

.mobile-btn.dash {
  background: linear-gradient(135deg, #00BCD4, #0097A7);
  color: white;
  grid-column: 1;
  grid-row: 2;
}

.mobile-btn.use {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  grid-column: 2;
  grid-row: 2;
}

.mobile-btn.menu {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  grid-column: 1 / 3;
  grid-row: 3;
  border-radius: 30px;
  font-size: 24px;
}

/* ==========================================
   ORIENTATION SPECIFIC STYLES
   ========================================== */
@media (orientation: landscape) {
  .mobile-controls {
    height: 140px;
    padding: 15px;
  }
  
  .joystick-container {
    width: 120px;
    height: 120px;
  }
  
  .mobile-actions {
    width: 170px;
    height: 140px;
    gap: 12px;
  }
  
  .mobile-btn {
    font-size: 28px;
  }
}

@media (orientation: portrait) {
  .mobile-controls {
    height: 180px;
    padding: 25px;
  }
  
  .joystick-container {
    width: 160px;
    height: 160px;
  }
  
  .mobile-actions {
    width: 220px;
    height: 180px;
    gap: 18px;
  }
  
  .mobile-btn {
    font-size: 36px;
  }
}
</style>
