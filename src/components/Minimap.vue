<template>
  <!-- Minimap Desktop -->
  <div class="minimap" v-if="!isMobile && showMinimap">
    <div class="minimap-content">
      <div class="minimap-grid">
        <div 
          v-for="(row, y) in minimapTiles" 
          :key="y"
          class="minimap-row"
        >
          <div 
            v-for="(tile, x) in row" 
            :key="x"
            class="minimap-tile"
            :class="{
              wall: tile === 1,
              floor: tile === 0,
              player: tile === 'player',
              enemy: tile === 'enemy',
              item: tile === 'item',
              exit: tile === 'exit',
              fog: !isTileVisible(x, y)
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Minimap Mobile -->
  <div class="mobile-minimap" v-if="isMobile && showMinimap">
    <div class="mobile-minimap-content">
      <div class="mobile-minimap-grid">
        <div 
          v-for="(row, y) in minimapTiles" 
          :key="y"
          class="mobile-minimap-row"
        >
          <div 
            v-for="(tile, x) in row" 
            :key="x"
            class="mobile-minimap-tile"
            :class="{
              wall: tile === 1,
              floor: tile === 0,
              player: tile === 'player',
              enemy: tile === 'enemy',
              item: tile === 'item',
              exit: tile === 'exit',
              fog: !isTileVisible(x, y)
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Minimap',
  props: {
    isMobile: Boolean,
    showMinimap: Boolean,
    minimapTiles: Array,
    isTileVisible: Function
  }
}
</script>

<style scoped>
/* ==========================================
   DESKTOP MINIMAP
   ========================================== */
.minimap {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 200px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 10px;
  z-index: 90;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.minimap-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 6px;
}

.minimap-grid {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(20, 1fr);
  gap: 0;
  width: 100%;
  height: 100%;
}

.minimap-row {
  display: contents;
}

.minimap-tile {
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
}

.minimap-tile.wall {
  background: #444;
}

.minimap-tile.floor {
  background: #222;
}

.minimap-tile.player {
  background: #4CAF50;
  box-shadow: 0 0 4px #4CAF50;
  animation: playerPulse 1s infinite;
}

.minimap-tile.enemy {
  background: #F44336;
  box-shadow: 0 0 3px #F44336;
}

.minimap-tile.item {
  background: #FF9800;
  box-shadow: 0 0 3px #FF9800;
}

.minimap-tile.exit {
  background: #00BCD4;
  box-shadow: 0 0 3px #00BCD4;
}

.minimap-tile.fog {
  background: #111;
  opacity: 0.5;
}

/* ==========================================
   MOBILE MINIMAP
   ========================================== */
.mobile-minimap {
  position: absolute;
  top: 120px;
  right: 10px;
  width: 120px;
  height: 120px;
  background: rgba(0,0,0,0.8);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  padding: 5px;
  z-index: 180;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.mobile-minimap-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 6px;
}

.mobile-minimap-grid {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(20, 1fr);
  gap: 0;
  width: 100%;
  height: 100%;
}

.mobile-minimap-row {
  display: contents;
}

.mobile-minimap-tile {
  width: 100%;
  height: 100%;
  transition: all 0.2s ease;
}

.mobile-minimap-tile.wall {
  background: #444;
}

.mobile-minimap-tile.floor {
  background: #222;
}

.mobile-minimap-tile.player {
  background: #4CAF50;
  box-shadow: 0 0 4px #4CAF50;
  animation: playerPulse 1s infinite;
}

.mobile-minimap-tile.enemy {
  background: #F44336;
  box-shadow: 0 0 3px #F44336;
}

.mobile-minimap-tile.item {
  background: #FF9800;
  box-shadow: 0 0 3px #FF9800;
}

.mobile-minimap-tile.exit {
  background: #00BCD4;
  box-shadow: 0 0 3px #00BCD4;
}

.mobile-minimap-tile.fog {
  background: #111;
  opacity: 0.5;
}

@keyframes playerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ==========================================
   ORIENTATION SPECIFIC STYLES
   ========================================== */
@media (orientation: landscape) {
  .mobile-minimap {
    width: 100px;
    height: 100px;
  }
}

@media (orientation: portrait) {
  .mobile-minimap {
    width: 140px;
    height: 140px;
  }
}
</style>
