<template>
  <!-- Movement Keys (Kiri) -->
  <div class="movement-keys" v-if="!isMobile">
    <button 
      class="key-btn w" 
      :class="{ active: keys.w }"
      @mousedown="$emit('keyDown', 'w')"
      @mouseup="$emit('keyUp', 'w')"
      @touchstart.prevent="$emit('keyDown', 'w')"
      @touchend.prevent="$emit('keyUp', 'w')"
    >
      W
    </button>
    <div class="horizontal-keys">
      <button 
        class="key-btn a" 
        :class="{ active: keys.a }"
        @mousedown="$emit('keyDown', 'a')"
        @mouseup="$emit('keyUp', 'a')"
        @touchstart.prevent="$emit('keyDown', 'a')"
        @touchend.prevent="$emit('keyUp', 'a')"
      >
        A
      </button>
      <button 
        class="key-btn s" 
        :class="{ active: keys.s }"
        @mousedown="$emit('keyDown', 's')"
        @mouseup="$emit('keyUp', 's')"
        @touchstart.prevent="$emit('keyDown', 's')"
        @touchend.prevent="$emit('keyUp', 's')"
      >
        S
      </button>
      <button 
        class="key-btn d" 
        :class="{ active: keys.d }"
        @mousedown="$emit('keyDown', 'd')"
        @mouseup="$emit('keyUp', 'd')"
        @touchstart.prevent="$emit('keyDown', 'd')"
        @touchend.prevent="$emit('keyUp', 'd')"
      >
        D
      </button>
    </div>
  </div>

  <!-- Action Buttons (Kanan) -->
  <div class="action-buttons" v-if="!isMobile">
    <button 
      class="action-btn attack"
      @click="$emit('performAction', 'attack')"
      @touchstart.prevent="$emit('performAction', 'attack')"
    >
      <span class="btn-icon">⚔️</span>
      Attack
    </button>
    <button 
      class="action-btn block"
      @mousedown="$emit('startBlocking')"
      @mouseup="$emit('stopBlocking')"
      @touchstart.prevent="$emit('startBlocking')"
      @touchend.prevent="$emit('stopBlocking')"
    >
      <span class="btn-icon">🛡️</span>
      Block
    </button>
    <button 
      class="action-btn dash"
      @click="$emit('performAction', 'dash')"
      @touchstart.prevent="$emit('performAction', 'dash')"
    >
      <span class="btn-icon">💨</span>
      Dash
    </button>
    <button 
      class="action-btn use"
      @click="$emit('useSelectedItem')"
      @touchstart.prevent="$emit('useSelectedItem')"
    >
      <span class="btn-icon">🫴</span>
      Use
    </button>
  </div>
</template>

<script>
export default {
  name: 'DesktopControls',
  props: {
    isMobile: Boolean,
    keys: Object
  },
  emits: [
    'keyDown',
    'keyUp',
    'performAction',
    'startBlocking',
    'stopBlocking',
    'useSelectedItem'
  ]
}
</script>

<style scoped>
/* ==========================================
   DESKTOP CONTROLS
   ========================================== */
.movement-keys {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.horizontal-keys {
  display: flex;
  gap: 5px;
}

.key-btn {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #555;
  border-radius: 8px;
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s ease;
}

.key-btn:hover, .key-btn.active {
  background: rgba(76, 175, 80, 0.3);
  border-color: #4CAF50;
  transform: scale(1.05);
}

.key-btn.w {
  margin-bottom: 5px;
}

.action-buttons {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  max-width: 400px;
}

.action-btn {
  flex: 1;
  min-width: 120px;
  height: 60px;
  background: linear-gradient(135deg, #333, #555);
  border: 2px solid #666;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.action-btn.attack {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  border-color: #F44336;
}

.action-btn.block {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-color: #2196F3;
}

.action-btn.dash {
  background: linear-gradient(135deg, #00BCD4, #0097A7);
  border-color: #00BCD4;
}

.action-btn.use {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  border-color: #4CAF50;
}

.btn-icon {
  font-size: 24px;
}
</style>
