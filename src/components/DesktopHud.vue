<template>
  <div class="game-hud" v-if="!isMobile">
    <!-- Health Bar -->
    <div class="health-bar">
      <div class="health-fill" :style="{ width: player.health + '%' }"></div>
      <div class="health-text">HP: {{ Math.ceil(player.health) }}/100</div>
    </div>

    <!-- Stamina Bar -->
    <div class="stamina-bar">
      <div class="stamina-fill" :style="{ width: player.stamina + '%' }"></div>
      <div class="stamina-text">STA: {{ Math.ceil(player.stamina) }}/100</div>
    </div>

    <!-- XP Bar -->
    <div class="xp-bar">
      <div class="xp-fill" :style="{ width: (player.xp % 100) + '%' }"></div>
      <div class="xp-text">Level {{ player.level }} - XP: {{ player.xp }}/{{ player.level * 100 }}</div>
    </div>

    <!-- Status Effects -->
    <div class="status-effects">
      <div 
        v-for="effect in activeStatusEffects" 
        :key="effect.id"
        class="status-effect"
        :class="effect.type"
        :title="effect.name + ': ' + effect.description"
      >
        <span class="effect-icon">{{ effect.icon }}</span>
        <span class="effect-timer" v-if="effect.duration">{{ effect.duration }}s</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DesktopHud',
  props: {
    isMobile: Boolean,
    player: Object,
    activeStatusEffects: Array
  }
}
</script>

<style scoped>
/* ==========================================
   DESKTOP HUD
   ========================================== */
.game-hud {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.health-bar,
.stamina-bar,
.xp-bar {
  width: 300px;
  height: 25px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #F44336, #D32F2F);
  transition: width 0.3s ease;
}

.stamina-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196F3, #1976D2);
  transition: width 0.3s ease;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF9800, #F57C00);
  transition: width 0.3s ease;
}

.health-text,
.stamina-text,
.xp-text {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.status-effects {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 300px;
}

.status-effect {
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-effect:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.effect-icon {
  font-size: 16px;
}

.effect-timer {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #F44336;
  color: white;
  font-size: 8px;
  padding: 1px 3px;
  border-radius: 50%;
  min-width: 14px;
  text-align: center;
  font-weight: bold;
}
</style>
