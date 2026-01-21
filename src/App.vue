<template>
  <div class="game-container" :class="{ 'mobile-view': isMobile, 'portrait-rotate': isMobile && isPortrait }">
    <!-- Canvas untuk Game -->
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    
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

    <!-- HUD Desktop -->
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

    <!-- HUD Mobile -->
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
            @click="selectQuickSlot(index)"
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

    <!-- Inventory Quick Access Desktop -->
    <div class="quick-inventory" v-if="!isMobile">
      <div 
        v-for="(slot, index) in quickSlots" 
        :key="index"
        class="quick-slot"
        :class="{ active: selectedQuickSlot === index, empty: !slot.item }"
        @click="selectQuickSlot(index)"
        @contextmenu.prevent="clearQuickSlot(index)"
      >
        <div v-if="slot.item" class="slot-content">
          <span class="slot-icon">{{ slot.item.icon }}</span>
          <span v-if="slot.item.quantity > 1" class="slot-quantity">{{ slot.item.quantity }}</span>
        </div>
        <div v-else class="slot-empty">
          {{ index + 1 }}
        </div>
      </div>
    </div>

    <!-- Kontrol Desktop -->
    <!-- Movement Keys (Kiri) -->
    <div class="movement-keys" v-if="!isMobile">
      <button 
        class="key-btn w" 
        :class="{ active: keys.w }"
        @mousedown="keyDown('w')"
        @mouseup="keyUp('w')"
        @touchstart.prevent="keyDown('w')"
        @touchend.prevent="keyUp('w')"
      >
        W
      </button>
      <div class="horizontal-keys">
        <button 
          class="key-btn a" 
          :class="{ active: keys.a }"
          @mousedown="keyDown('a')"
          @mouseup="keyUp('a')"
          @touchstart.prevent="keyDown('a')"
          @touchend.prevent="keyUp('a')"
        >
          A
        </button>
        <button 
          class="key-btn s" 
          :class="{ active: keys.s }"
          @mousedown="keyDown('s')"
          @mouseup="keyUp('s')"
          @touchstart.prevent="keyDown('s')"
          @touchend.prevent="keyUp('s')"
        >
          S
        </button>
        <button 
          class="key-btn d" 
          :class="{ active: keys.d }"
          @mousedown="keyDown('d')"
          @mouseup="keyUp('d')"
          @touchstart.prevent="keyDown('d')"
          @touchend.prevent="keyUp('d')"
        >
          D
        </button>
      </div>
    </div>

    <!-- Action Buttons (Kanan) -->
    <div class="action-buttons" v-if="!isMobile">
      <button 
        class="action-btn attack"
        @click="performAction('attack')"
        @touchstart.prevent="performAction('attack')"
      >
        <span class="btn-icon">⚔️</span>
        Attack
      </button>
      <button 
        class="action-btn block"
        @mousedown="startBlocking"
        @mouseup="stopBlocking"
        @touchstart.prevent="startBlocking"
        @touchend.prevent="stopBlocking"
      >
        <span class="btn-icon">🛡️</span>
        Block
      </button>
      <button 
        class="action-btn dash"
        @click="performAction('dash')"
        @touchstart.prevent="performAction('dash')"
      >
        <span class="btn-icon">💨</span>
        Dash
      </button>
      <button 
        class="action-btn use"
        @click="useSelectedItem"
        @touchstart.prevent="useSelectedItem"
      >
        <span class="btn-icon">🫴</span>
        Use
      </button>
    </div>

    <!-- Kontrol Mobile -->
    <div class="mobile-controls" v-if="isMobile">
      <!-- Joystick Kiri -->
      <div class="joystick-container left">
        <div 
          class="joystick-base"
          ref="joystickBase"
          @touchstart="startJoystick"
          @touchmove="updateJoystick"
          @touchend="endJoystick"
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
            @touchstart.prevent="performAction('attack')"
          >
            ⚔️
          </button>
          <button 
            class="mobile-btn block"
            @touchstart.prevent="startBlocking"
            @touchend.prevent="stopBlocking"
          >
            🛡️
          </button>
        </div>
        <div class="mobile-action-row">
          <button 
            class="mobile-btn dash"
            @touchstart.prevent="performAction('dash')"
          >
            💨
          </button>
          <button 
            class="mobile-btn use"
            @touchstart.prevent="useSelectedItem"
          >
            🫴
          </button>
        </div>
        <div class="mobile-action-row">
          <button 
            class="mobile-btn menu"
            @click="toggleMobileMenu"
          >
            ☰
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog Box -->
    <div 
      v-if="activeDialog"
      class="dialog-overlay"
      @click="nextDialogLine"
    >
      <div class="dialog-box">
        <div class="dialog-header">
          <span class="dialog-character">{{ activeDialog.character }}</span>
          <span class="dialog-emotion">{{ activeDialog.emotion }}</span>
        </div>
        <div class="dialog-text">
          {{ dialogText }}
        </div>
        <div class="dialog-indicator">▼</div>
      </div>
    </div>

    <!-- Menu Utama -->
    <div v-if="showMainMenu" class="main-menu-overlay">
      <div class="main-menu">
        <h1 class="game-title">DUNGEON MAZE</h1>
        
        <div class="menu-section">
          <button class="menu-btn" @click="startNewGame">
            <span class="menu-icon">▶️</span>
            NEW GAME
          </button>
          <button class="menu-btn" @click="continueGame" :disabled="!hasSaveData">
            <span class="menu-icon">⏯️</span>
            CONTINUE
          </button>
          <button class="menu-btn" @click="showLoadMenu = !showLoadMenu">
            <span class="menu-icon">📂</span>
            LOAD GAME
          </button>
        </div>

        <div class="menu-section">
          <h3>DIFFICULTY</h3>
          <div class="difficulty-selector">
            <button 
              v-for="diff in difficulties" 
              :key="diff.id"
              class="diff-btn"
              :class="{ active: gameDifficulty === diff.id }"
              @click="setDifficulty(diff.id)"
            >
              {{ diff.name }}
            </button>
          </div>
        </div>

        <div class="menu-section">
          <h3>SETTINGS</h3>
          <div class="settings-grid">
            <div class="setting">
              <span>Music Volume</span>
              <input type="range" v-model="musicVolume" min="0" max="100">
            </div>
            <div class="setting">
              <span>Sound Effects</span>
              <input type="range" v-model="sfxVolume" min="0" max="100">
            </div>
            <div class="setting">
              <span>Show Minimap</span>
              <label class="toggle-switch">
                <input type="checkbox" v-model="showMinimap">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="menu-section stats">
          <h3>STATISTICS</h3>
          <div class="stat-list">
            <div class="stat-item">
              <span>Games Played:</span>
              <span>{{ statistics.gamesPlayed }}</span>
            </div>
            <div class="stat-item">
              <span>Total Kills:</span>
              <span>{{ statistics.totalKills }}</span>
            </div>
            <div class="stat-item">
              <span>Total Deaths:</span>
              <span>{{ statistics.totalDeaths }}</span>
            </div>
            <div class="stat-item">
              <span>Highest Level:</span>
              <span>{{ statistics.highestLevel }}</span>
            </div>
          </div>
        </div>

        <div class="menu-footer">
          <button class="menu-btn exit" @click="exitGame">
            <span class="menu-icon">🚪</span>
            EXIT
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="showMobileMenu" class="mobile-menu-overlay">
      <div class="mobile-menu">
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          ✕
        </button>
        <div class="mobile-menu-section">
          <button class="mobile-menu-item" @click="saveGame">
            💾 Save Game
          </button>
          <button class="mobile-menu-item" @click="loadGame">
            📂 Load Game
          </button>
          <button class="mobile-menu-item" @click="showSettings = !showSettings">
            ⚙️ Settings
          </button>
          <button class="mobile-menu-item" @click="quitToMenu">
            🏠 Quit to Menu
          </button>
        </div>
        
        <div v-if="showSettings" class="mobile-settings">
          <div class="mobile-setting">
            <span>Music</span>
            <input type="range" v-model="musicVolume" min="0" max="100">
          </div>
          <div class="mobile-setting">
            <span>SFX</span>
            <input type="range" v-model="sfxVolume" min="0" max="100">
          </div>
          <div class="mobile-setting">
            <span>Minimap</span>
            <label class="mobile-toggle">
              <input type="checkbox" v-model="showMinimap">
              <span class="mobile-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Inventory Full Screen -->
    <div v-if="showInventory" class="inventory-overlay">
      <div class="inventory-container">
        <div class="inventory-header">
          <h2>INVENTORY</h2>
          <button class="close-inventory" @click="toggleInventory">✕</button>
        </div>
        
        <div class="inventory-grid">
          <div 
            v-for="(item, index) in player.inventory" 
            :key="item.id"
            class="inventory-item-slot"
            :class="{ 
              selected: selectedInventorySlot === index,
              weapon: item.type === 'weapon',
              potion: item.type === 'potion',
              key: item.type === 'key',
              armor: item.type === 'armor'
            }"
            @click="selectInventorySlot(index)"
            @contextmenu.prevent="useItem(item)"
          >
            <div class="item-icon">{{ item.icon }}</div>
            <span class="item-name">{{ item.name }}</span>
            <span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
            <div v-if="item.equipped" class="item-equipped">E</div>
          </div>
          <div 
            v-for="n in 20 - player.inventory.length" 
            :key="'empty-' + n"
            class="inventory-slot empty"
          >
            EMPTY
          </div>
        </div>

        <div class="inventory-info" v-if="selectedInventoryItem">
          <h3>{{ selectedInventoryItem.name }}</h3>
          <p>{{ selectedInventoryItem.description }}</p>
          <div class="item-stats">
            <div v-if="selectedInventoryItem.damage" class="item-stat">
              <span>Damage:</span>
              <span class="stat-value">{{ selectedInventoryItem.damage }}</span>
            </div>
            <div v-if="selectedInventoryItem.defense" class="item-stat">
              <span>Defense:</span>
              <span class="stat-value">{{ selectedInventoryItem.defense }}</span>
            </div>
            <div v-if="selectedInventoryItem.healing" class="item-stat">
              <span>Healing:</span>
              <span class="stat-value">{{ selectedInventoryItem.healing }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button 
              class="item-btn equip"
              @click="equipItem(selectedInventoryItem)"
              v-if="selectedInventoryItem.type === 'weapon' || selectedInventoryItem.type === 'armor'"
            >
              {{ selectedInventoryItem.equipped ? 'UNEQUIP' : 'EQUIP' }}
            </button>
            <button 
              class="item-btn use"
              @click="useItem(selectedInventoryItem)"
              v-if="selectedInventoryItem.type === 'potion'"
            >
              USE
            </button>
            <button 
              class="item-btn drop"
              @click="dropItem(selectedInventoryItem)"
            >
              DROP
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over Screen -->
    <div v-if="gameOver" class="game-over-overlay">
      <div class="game-over-screen">
        <h1 class="game-over-title">{{ gameOverReason === 'death' ? 'YOU DIED' : 'VICTORY!' }}</h1>
        
        <div class="game-over-stats">
          <div class="stat">
            <span>Level Reached:</span>
            <span class="value">{{ player.level }}</span>
          </div>
          <div class="stat">
            <span>Enemies Defeated:</span>
            <span class="value">{{ enemiesDefeated }}</span>
          </div>
          <div class="stat">
            <span>Time Survived:</span>
            <span class="value">{{ formatTime(gameTime) }}</span>
          </div>
          <div class="stat">
            <span>Items Collected:</span>
            <span class="value">{{ itemsCollected }}</span>
          </div>
        </div>

        <div class="game-over-actions">
          <button class="game-over-btn retry" @click="retryGame">
            🔄 RETRY
          </button>
          <button v-if="gameOverReason === 'victory'" class="game-over-btn next" @click="nextFloor()">
            ⬆️ NEXT LEVEL
          </button>
          <button class="game-over-btn menu" @click="quitToMenu">
            🏠 MAIN MENU
          </button>
          <button class="game-over-btn share" @click="shareScore">
            📢 SHARE SCORE
          </button>
        </div>
      </div>
    </div>

    <!-- Level Complete Overlay -->
    <div v-if="showLevelComplete" class="level-complete-overlay">
      <div class="level-complete-screen">
        <h1 class="level-complete-title">LEVEL COMPLETE!</h1>
        
        <div class="level-complete-stats">
          <div class="stat">
            <span>Floor:</span>
            <span class="value">{{ currentFloor }}</span>
          </div>
          <div class="stat">
            <span>Enemies Defeated:</span>
            <span class="value">{{ enemiesDefeated }}</span>
          </div>
          <div class="stat">
            <span>Time:</span>
            <span class="value">{{ formatTime(gameTime) }}</span>
          </div>
        </div>

        <div class="level-complete-actions">
          <button class="level-complete-btn next" @click="confirmNextLevel">
            ⬆️ NEXT LEVEL
          </button>
          <button class="level-complete-btn menu" @click="backToMenuFromLevel">
            🏠 MAIN MENU
          </button>
        </div>
      </div>
    </div>

    <!-- Tutorial Overlay -->
    <div v-if="showTutorial" class="tutorial-overlay">
      <div class="tutorial-content">
        <h2>HOW TO PLAY</h2>
        <div class="tutorial-section">
          <h3>MOVEMENT</h3>
          <p>Desktop: Use WASD keys</p>
          <p>Mobile: Use the joystick on the left</p>
        </div>
        <div class="tutorial-section">
          <h3>ACTIONS</h3>
          <p>Attack: Press attack button</p>
          <p>Block: Hold block button to reduce damage</p>
          <p>Dash: Quick dodge (consumes stamina)</p>
        </div>
        <div class="tutorial-section">
          <h3>OBJECTIVE</h3>
          <p>Explore the maze, defeat enemies, and find the exit</p>
          <p>Collect items and level up to become stronger</p>
        </div>
        <button class="tutorial-btn" @click="hideTutorial">
          GOT IT!
        </button>
      </div>
    </div>

    <!-- Notifikasi -->
    <TransitionGroup name="notification">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
        @click="removeNotification(notification.id)"
      >
        <span class="notification-icon">{{ notification.icon }}</span>
        <span class="notification-text">{{ notification.text }}</span>
      </div>
    </TransitionGroup>

    <!-- Loading Screen -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <div class="loading-text">LOADING DUNGEON...</div>
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Audio Controls -->
    <div class="audio-controls">
      <button 
        class="audio-btn"
        @click="toggleMusic"
        :class="{ muted: !musicEnabled }"
      >
        {{ musicEnabled ? '🔊' : '🔇' }}
      </button>
      <button 
        class="audio-btn"
        @click="toggleSFX"
        :class="{ muted: !sfxEnabled }"
      >
        {{ sfxEnabled ? '🎵' : '🔇' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'

export default {
  name: 'DungeonMazeGame',
  
  setup() {
    // ==========================================
    // 1. STATE & REFS
    // ==========================================
    const gameCanvas = ref(null)
    const joystickBase = ref(null)
    
    const isMobile = ref(false)
    const loading = ref(false)
    const loadingProgress = ref(0)
    const gameOver = ref(false)
    const gameOverReason = ref('death')
    const showMainMenu = ref(true)
    const showInventory = ref(false)
    const showMobileMenu = ref(false)
    const showMinimap = ref(true)
    const showTutorial = ref(true)
    const showLevelComplete = ref(false)
    const gamePaused = ref(false)
    const isPortrait = ref(false)
    
    // Game state
    const gameTime = ref(0)
    const currentFloor = ref(1)
    const enemiesDefeated = ref(0)
    const itemsCollected = ref(0)
    
    // Player state
    const player = reactive({
      x: 100,
      y: 100,
      width: 30,
      height: 30,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      level: 1,
      xp: 0,
      speed: 3,
      baseSpeed: 3,
      damage: 10,
      defense: 0,
      direction: { x: 0, y: -1 },
      isBlocking: false,
      isDashing: false,
      dashCooldown: 0,
      attackCooldown: 0,
      inventory: [],
      equippedWeapon: null,
      equippedArmor: null
    })
    
    // Input state
    const keys = reactive({
      w: false,
      a: false,
      s: false,
      d: false
    })
    
    const joystickPosition = reactive({ x: 0, y: 0 })
    const joystickActive = ref(false)
    const joystickTouchId = ref(null)
    const selectedQuickSlot = ref(0)
    
    // Game objects
    const enemies = ref([])
    const items = ref([])
    const walls = ref([])
    const floors = ref([])
    const exits = ref([])
    const projectiles = ref([])
    const particles = ref([])
    
    // UI state
    const notifications = ref([])
    const notificationId = ref(0)
    const activeStatusEffects = ref([])
    const activeDialog = ref(null)
    const dialogText = ref('')
    const dialogIndex = ref(0)
    
    // Settings
    const gameDifficulty = ref('normal')
    const musicVolume = ref(50)
    const sfxVolume = ref(70)
    const musicEnabled = ref(true)
    const sfxEnabled = ref(true)
    
    const difficulties = [
      { id: 'easy', name: 'EASY', enemyMultiplier: 0.7, damageMultiplier: 0.8 },
      { id: 'normal', name: 'NORMAL', enemyMultiplier: 1.0, damageMultiplier: 1.0 },
      { id: 'hard', name: 'HARD', enemyMultiplier: 1.5, damageMultiplier: 1.2 },
      { id: 'expert', name: 'EXPERT', enemyMultiplier: 2.0, damageMultiplier: 1.5 }
    ]
    
    // Statistics
    const statistics = reactive({
      gamesPlayed: 0,
      totalKills: 0,
      totalDeaths: 0,
      highestLevel: 1,
      totalPlayTime: 0,
      itemsCollected: 0
    })
    
    // Quick slots
    const quickSlots = ref(Array(5).fill().map(() => ({ item: null })))
    
    // Maze configuration
    const mazeWidth = 20
    const mazeHeight = 20
    const tileSize = 64
    const minimapTiles = ref([])
    
    // Level configurations
    const levelConfigs = [
      { name: 'Floor 1: The Beginning', enemyCount: 3, enemyHealthMult: 0.8, enemyDamageMult: 0.8, itemCount: 3 },
      { name: 'Floor 2: Deeper Caves', enemyCount: 5, enemyHealthMult: 1.0, enemyDamageMult: 1.0, itemCount: 4 },
      { name: 'Floor 3: Dark Chambers', enemyCount: 7, enemyHealthMult: 1.2, enemyDamageMult: 1.1, itemCount: 5 },
      { name: 'Floor 4: Ancient Ruins', enemyCount: 9, enemyHealthMult: 1.5, enemyDamageMult: 1.3, itemCount: 6 },
      { name: 'Floor 5: The Abyss', enemyCount: 11, enemyHealthMult: 1.8, enemyDamageMult: 1.5, itemCount: 7 }
    ]
    
    // Game loop
    let animationFrameId = null
    let lastTime = 0
    
    // ==========================================
    // 2. COMPUTED PROPERTIES
    // ==========================================
    const selectedInventoryItem = computed(() => {
      if (selectedQuickSlot.value >= 0 && selectedQuickSlot.value < quickSlots.value.length) {
        return quickSlots.value[selectedQuickSlot.value].item
      }
      return null
    })
    
    const hasSaveData = computed(() => {
      return localStorage.getItem('dungeon_maze_save') !== null
    })
    
    const currentDifficulty = computed(() => {
      return difficulties.find(d => d.id === gameDifficulty.value)
    })
    
    // ==========================================
    // 3. GAME INITIALIZATION
    // ==========================================
    const initGame = () => {
      showMainMenu.value = false
      loading.value = true
      loadingProgress.value = 0
      
      // Simulate loading steps
      const steps = [
        'Generating maze...',
        'Placing enemies...',
        'Creating items...',
        'Initializing player...',
        'Setting up rendering...'
      ]
      
      steps.forEach((step, index) => {
        setTimeout(() => {
          loadingProgress.value = ((index + 1) / steps.length) * 100
          console.log(step)
        }, index * 1000)
      })
      
      // Complete loading
      setTimeout(() => {
        try {
          const config = levelConfigs[Math.min(currentFloor.value - 1, levelConfigs.length - 1)]
          
          generateMaze()
          spawnPlayer()
          spawnEnemies(config.enemyCount)
          spawnItems(config.itemCount)
          spawnExit()
          
          // Apply difficulty to enemies
          applyDifficultyToEnemies()
          
          loading.value = false
          gameTime.value = 0
          enemiesDefeated.value = 0
          itemsCollected.value = 0
          showMainMenu.value = false
          console.log('Game initialized successfully')
        } catch (error) {
          console.error('Error initializing game:', error)
          loading.value = false
          showMainMenu.value = false
          addNotification('Failed to initialize game. Please refresh.', 'error')
        }
      }, steps.length * 1000)
    }
    
    const generateMaze = () => {
      try {
        // Reset maze
        walls.value = []
        floors.value = []
        
        // Create a simple maze algorithm
        for (let y = 0; y < mazeHeight; y++) {
          for (let x = 0; x < mazeWidth; x++) {
            // Create border walls
            if (x === 0 || y === 0 || x === mazeWidth - 1 || y === mazeHeight - 1) {
              walls.value.push({ x: x * tileSize, y: y * tileSize, width: tileSize, height: tileSize })
            } 
            // Create some random walls
            else if (Math.random() > 0.7) {
              walls.value.push({ x: x * tileSize, y: y * tileSize, width: tileSize, height: tileSize })
            } 
            // Create floor
            else {
              floors.value.push({ x: x * tileSize, y: y * tileSize, width: tileSize, height: tileSize })
            }
          }
        }
        
        // Ensure there's a clear path
        createPath(1, 1, mazeWidth - 2, mazeHeight - 2)
        
        // Update minimap
        updateMinimap()
      } catch (error) {
        console.error('Error generating maze:', error)
        // Fallback to simple maze
        createSimpleMaze()
      }
    }

    const createSimpleMaze = () => {
      walls.value = []
      floors.value = []
      
      // Create border
      for (let y = 0; y < mazeHeight; y++) {
        for (let x = 0; x < mazeWidth; x++) {
          if (x === 0 || y === 0 || x === mazeWidth - 1 || y === mazeHeight - 1) {
            walls.value.push({ x: x * tileSize, y: y * tileSize, width: tileSize, height: tileSize })
          } else {
            floors.value.push({ x: x * tileSize, y: y * tileSize, width: tileSize, height: tileSize })
          }
        }
      }
    }
    
    const createPath = (startX, startY, endX, endY) => {
      // Simple path carving algorithm
      let x = startX
      let y = startY
      
      for (let attempts = 0; attempts < 1000 && (x !== endX || y !== endY); attempts++) {
        // Clear the current tile
        walls.value = walls.value.filter(wall => 
          !(Math.floor(wall.x / tileSize) === x && Math.floor(wall.y / tileSize) === y)
        )
        
        // Add floor
        floors.value.push({ x: x * tileSize, y: y * tileSize, width: tileSize, height: tileSize })
        
        // Move towards end
        if (x < endX && Math.random() > 0.3) x++
        else if (x > endX && Math.random() > 0.3) x--
        else if (y < endY && Math.random() > 0.3) y++
        else if (y > endY && Math.random() > 0.3) y--
        else {
          // Random movement if stuck
          const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
          ]
          const dir = directions[Math.floor(Math.random() * directions.length)]
          x = Math.max(1, Math.min(mazeWidth - 2, x + dir.dx))
          y = Math.max(1, Math.min(mazeHeight - 2, y + dir.dy))
        }
      }
      
      // Clear the end tile
      walls.value = walls.value.filter(wall => 
        !(Math.floor(wall.x / tileSize) === endX && Math.floor(wall.y / tileSize) === endY)
      )
      floors.value.push({ x: endX * tileSize, y: endY * tileSize, width: tileSize, height: tileSize })
    }
    
    const updateMinimap = () => {
      minimapTiles.value = []
      
      for (let y = 0; y < mazeHeight; y++) {
        const row = []
        for (let x = 0; x < mazeWidth; x++) {
          // Check if it's a wall
          const isWall = walls.value.some(wall => 
            Math.floor(wall.x / tileSize) === x && Math.floor(wall.y / tileSize) === y
          )
          
          // Check if it's the player
          const isPlayer = Math.floor(player.x / tileSize) === x && Math.floor(player.y / tileSize) === y
          
          // Check if it's an enemy
          const isEnemy = enemies.value.some(enemy => 
            Math.floor(enemy.x / tileSize) === x && Math.floor(enemy.y / tileSize) === y
          )
          
          // Check if it's an item
          const isItem = items.value.some(item => 
            Math.floor(item.x / tileSize) === x && Math.floor(item.y / tileSize) === y
          )
          
          // Check if it's an exit
          const isExit = exits.value.some(exit => 
            Math.floor(exit.x / tileSize) === x && Math.floor(exit.y / tileSize) === y
          )
          
          if (isPlayer) row.push('player')
          else if (isEnemy) row.push('enemy')
          else if (isItem) row.push('item')
          else if (isExit) row.push('exit')
          else if (isWall) row.push(1)
          else row.push(0)
        }
        minimapTiles.value.push(row)
      }
    }
    
    const isTileVisible = (x, y) => {
      // Simple visibility check based on distance from player
      const playerTileX = Math.floor(player.x / tileSize)
      const playerTileY = Math.floor(player.y / tileSize)
      const distance = Math.sqrt(Math.pow(playerTileX - x, 2) + Math.pow(playerTileY - y, 2))
      
      return distance < 8 // Visibility radius
    }
    
    const spawnPlayer = () => {
      // Find a safe starting position with enhanced checking
      let safeX, safeY
      let attempts = 0
      
      do {
        safeX = Math.floor(Math.random() * (mazeWidth - 4)) + 2
        safeY = Math.floor(Math.random() * (mazeHeight - 4)) + 2
        attempts++
        
        const testX = safeX * tileSize + tileSize / 2
        const testY = safeY * tileSize + tileSize / 2
        
        // Enhanced safety check with margin
        const margin = 5
        if (
          !checkWallCollision(testX - margin, testY - margin, player.width + margin * 2, player.height + margin * 2) &&
          !checkWallCollision(testX, testY, player.width, player.height)
        ) {
          break
        }
      } while (attempts < 200)
      
      if (attempts >= 200) {
        // Fallback to center position
        safeX = Math.floor(mazeWidth / 2)
        safeY = Math.floor(mazeHeight / 2)
        console.warn('Could not find safe spawn position, using center')
      }
      
      player.x = safeX * tileSize + tileSize / 2
      player.y = safeY * tileSize + tileSize / 2
      
      // Final safety check
      if (checkWallCollision(player.x, player.y)) {
        // Emergency reposition
        player.x = tileSize * 2 + tileSize / 2
        player.y = tileSize * 2 + tileSize / 2
      }
      
      // Initialize inventory
      player.inventory = [
        {
          id: 1,
          name: 'Rusty Sword',
          type: 'weapon',
          icon: '🗡️',
          damage: 10,
          description: 'An old but trusty sword',
          equipped: true
        },
        {
          id: 2,
          name: 'Health Potion',
          type: 'potion',
          icon: '🧪',
          healing: 30,
          quantity: 3,
          description: 'Restores health'
        }
      ]
      
      player.equippedWeapon = player.inventory[0]
    }
    
    const spawnEnemies = (count) => {
      const config = levelConfigs[Math.min(currentFloor.value - 1, levelConfigs.length - 1)]
      enemies.value = []
      
      for (let i = 0; i < count; i++) {
        let safeX, safeY
        let attempts = 0
        
        do {
          safeX = Math.floor(Math.random() * (mazeWidth - 4)) + 2
          safeY = Math.floor(Math.random() * (mazeHeight - 4)) + 2
          const distanceToPlayer = Math.sqrt(
            Math.pow(safeX - player.x / tileSize, 2) + Math.pow(safeY - player.y / tileSize, 2)
          )
          attempts++
        } while (
          (walls.value.some(wall => 
            Math.floor(wall.x / tileSize) === safeX && Math.floor(wall.y / tileSize) === safeY
          ) || 
          enemies.value.some(enemy => 
            Math.floor(enemy.x / tileSize) === safeX && Math.floor(enemy.y / tileSize) === safeY
          ) ||
          Math.sqrt(Math.pow(safeX - player.x / tileSize, 2) + Math.pow(safeY - player.y / tileSize, 2)) < 5) &&
          attempts < 100
        )
        
        const enemyTypes = [
          {
            name: 'Goblin',
            color: '#4CAF50',
            speed: 1.5,
            health: 30,
            damage: 5,
            experience: 10,
            icon: '👺'
          },
          {
            name: 'Skeleton',
            color: '#F5F5F5',
            speed: 1.2,
            health: 40,
            damage: 8,
            experience: 15,
            icon: '💀'
          },
          {
            name: 'Slime',
            color: '#2196F3',
            speed: 0.8,
            health: 20,
            damage: 3,
            experience: 5,
            icon: '🟢'
          },
          {
            name: 'Bat',
            color: '#795548',
            speed: 2.5,
            health: 15,
            damage: 4,
            experience: 8,
            icon: '🦇'
          }
        ]
        
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
        
        enemies.value.push({
          id: i,
          x: safeX * tileSize + tileSize / 2,
          y: safeY * tileSize + tileSize / 2,
          width: 28,
          height: 28,
          color: type.color,
          name: type.name,
          speed: type.speed,
          health: type.health * config.enemyHealthMult,
          maxHealth: type.health * config.enemyHealthMult,
          damage: type.damage * config.enemyDamageMult,
          experience: type.experience,
          icon: type.icon,
          state: 'idle',
          target: null,
          lastAttack: 0,
          attackCooldown: 1000,
          detectionRange: 200,
          attackRange: 40
        })
      }
      
      // Apply difficulty settings to all spawned enemies
      applyDifficultyToEnemies()
    }
    
    const applyDifficultyToEnemies = () => {
      const diff = currentDifficulty.value
      if (!diff) return
      
      enemies.value.forEach(enemy => {
        const baseHealth = enemy.maxHealth / (diff.enemyMultiplier || 1)
        const baseDamage = enemy.damage / (diff.damageMultiplier || 1)
        
        enemy.maxHealth = baseHealth * diff.enemyMultiplier
        enemy.health = enemy.maxHealth
        enemy.damage = baseDamage * diff.damageMultiplier
      })
      
      console.log(`Applied difficulty ${diff.name} to ${enemies.value.length} enemies`)
    }
    
    const spawnItems = (count) => {
      items.value = []
      
      const itemTypes = [
        {
          name: 'Health Potion',
          type: 'potion',
          color: '#FF5252',
          icon: '🧪',
          healing: 30
        },
        {
          name: 'Stamina Potion',
          type: 'potion',
          color: '#4CAF50',
          icon: '💚',
          stamina: 40
        },
        {
          name: 'Steel Sword',
          type: 'weapon',
          color: '#607D8B',
          icon: '⚔️',
          damage: 15
        },
        {
          name: 'Leather Armor',
          type: 'armor',
          color: '#795548',
          icon: '🧥',
          defense: 5
        },
        {
          name: 'Gold Coin',
          type: 'currency',
          color: '#FFD700',
          icon: '🪙',
          value: 10
        },
        {
          name: 'Dungeon Key',
          type: 'key',
          color: '#FF9800',
          icon: '🔑'
        }
      ]
      
      for (let i = 0; i < count; i++) {
        let safeX, safeY
        let attempts = 0
        
        do {
          safeX = Math.floor(Math.random() * (mazeWidth - 4)) + 2
          safeY = Math.floor(Math.random() * (mazeHeight - 4)) + 2
          attempts++
        } while (
          walls.value.some(wall => 
            Math.floor(wall.x / tileSize) === safeX && Math.floor(wall.y / tileSize) === safeY
          ) ||
          enemies.value.some(enemy => 
            Math.floor(enemy.x / tileSize) === safeX && Math.floor(enemy.y / tileSize) === safeY
          ) ||
          items.value.some(item => 
            Math.floor(item.x / tileSize) === safeX && Math.floor(item.y / tileSize) === safeY
          ) &&
          attempts < 100
        )
        
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)]
        
        items.value.push({
          id: i,
          x: safeX * tileSize + tileSize / 2,
          y: safeY * tileSize + tileSize / 2,
          width: 20,
          height: 20,
          ...type,
          collected: false
        })
      }
    }
    
    const spawnExit = () => {
      // Place exit far from player
      let exitX, exitY
      let attempts = 0
      
      do {
        exitX = Math.floor(Math.random() * (mazeWidth - 4)) + 2
        exitY = Math.floor(Math.random() * (mazeHeight - 4)) + 2
        const distance = Math.sqrt(
          Math.pow(exitX - player.x / tileSize, 2) + Math.pow(exitY - player.y / tileSize, 2)
        )
        attempts++
      } while (
        walls.value.some(wall => 
          Math.floor(wall.x / tileSize) === exitX && Math.floor(wall.y / tileSize) === exitY
        ) ||
        distance < 10 &&
        attempts < 100
      )
      
      exits.value = [{
        x: exitX * tileSize,
        y: exitY * tileSize,
        width: tileSize,
        height: tileSize,
        color: '#FFD700'
      }]
    }
    
    // ==========================================
    // 4. GAME LOOP
    // ==========================================
    const gameLoop = (timestamp) => {
      if (!lastTime) lastTime = timestamp
      const deltaTime = timestamp - lastTime
      lastTime = timestamp
      
      if (!gamePaused.value && !gameOver.value && !showMainMenu.value && !loading.value) {
        updateGame(deltaTime)
        renderGame()
      }
      
      animationFrameId = requestAnimationFrame(gameLoop)
    }
    
    const updateGame = (deltaTime) => {
      // Update game time
      gameTime.value += deltaTime / 1000
      
      // Update player
      updatePlayer(deltaTime)
      
      // Update enemies
      updateEnemies(deltaTime)
      
      // Update projectiles
      updateProjectiles(deltaTime)
      
      // Update particles
      updateParticles(deltaTime)
      
      // Update cooldowns
      updateCooldowns(deltaTime)
      
      // Update minimap
      updateMinimap()
      
      // Check collisions
      checkCollisions()
      
      // Check for exit
      checkExit()
      
      // Check if all enemies defeated
      if (enemies.value.length === 0 && !gameOver.value) {
        showLevelComplete.value = true
        gamePaused.value = true
      }
    }
    
    const updatePlayer = (deltaTime) => {
      if (player.isDashing) return
      
      // Calculate movement vector
      let moveX = 0
      let moveY = 0
      
      if (!isMobile.value) {
        // Desktop controls
        if (keys.w) moveY -= 1
        if (keys.s) moveY += 1
        if (keys.a) moveX -= 1
        if (keys.d) moveX += 1
      } else {
        // Mobile joystick
        moveX = joystickPosition.x / 50
        moveY = joystickPosition.y / 50
      }
      
      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY)
        moveX /= length
        moveY /= length
      }
      
      // Update player direction
      if (moveX !== 0 || moveY !== 0) {
        player.direction.x = moveX
        player.direction.y = moveY
      }
      
      // Calculate actual movement
      const speed = player.isBlocking ? player.speed * 0.5 : player.speed
      const newX = player.x + moveX * speed
      const newY = player.y + moveY * speed
      
      // Enhanced collision detection with sliding
      const collision = getWallCollisionResponse(newX, newY)
      
      // Apply sliding movement to prevent getting stuck
      if (!checkWallCollision(newX, newY)) {
        // No collision, move normally
        player.x = newX
        player.y = newY
      } else {
        // Collision detected, try sliding
        if (!checkWallCollision(collision.slideX, player.y)) {
          player.x = collision.slideX
        }
        if (!checkWallCollision(player.x, collision.slideY)) {
          player.y = collision.slideY
        }
      }
      
      // Additional safety check: ensure player is never inside a wall
      if (checkWallCollision(player.x, player.y)) {
        // Emergency: push player to nearest safe position
        let foundSafePosition = false
        for (let distance = 1; distance <= 50 && !foundSafePosition; distance++) {
          const directions = [
            { x: player.x + distance, y: player.y },
            { x: player.x - distance, y: player.y },
            { x: player.x, y: player.y + distance },
            { x: player.x, y: player.y - distance },
            { x: player.x + distance, y: player.y + distance },
            { x: player.x - distance, y: player.y - distance },
            { x: player.x + distance, y: player.y - distance },
            { x: player.x - distance, y: player.y + distance }
          ]
          
          for (const pos of directions) {
            if (!checkWallCollision(pos.x, pos.y)) {
              player.x = pos.x
              player.y = pos.y
              foundSafePosition = true
              break
            }
          }
        }
      }
      
      // Regenerate stamina
      if (!player.isBlocking && player.stamina < player.maxStamina) {
        player.stamina = Math.min(player.maxStamina, player.stamina + 10 * deltaTime / 1000)
      }
      
      // Regenerate health slowly
      if (player.health < player.maxHealth && player.stamina > 50) {
        player.health = Math.min(player.maxHealth, player.health + 1 * deltaTime / 1000)
      }
      
      // Update cooldowns
      if (player.dashCooldown > 0) {
        player.dashCooldown = Math.max(0, player.dashCooldown - deltaTime)
      }
      if (player.attackCooldown > 0) {
        player.attackCooldown = Math.max(0, player.attackCooldown - deltaTime)
      }
    }
    
    const updateEnemies = (deltaTime) => {
      enemies.value.forEach(enemy => {
        // Skip if dead
        if (enemy.health <= 0) return
        
        // Calculate distance to player
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Update enemy state
        if (distance < enemy.detectionRange) {
          enemy.state = 'chasing'
          enemy.target = { x: player.x, y: player.y }
        } else {
          enemy.state = 'idle'
          enemy.target = null
        }
        
        // Move enemy
        if (enemy.state === 'chasing' && enemy.target) {
          // Calculate direction to target
          const dirX = enemy.target.x - enemy.x
          const dirY = enemy.target.y - enemy.y
          const length = Math.sqrt(dirX * dirX + dirY * dirY)
          
          if (length > 0) {
            // Normalize direction
            const normX = dirX / length
            const normY = dirY / length
            
            // Move towards target
            const newX = enemy.x + normX * enemy.speed
            const newY = enemy.y + normY * enemy.speed
            
            // Enhanced collision detection with sliding for enemies
            const collision = getWallCollisionResponse(newX, newY, enemy.width, enemy.height)
            
            // Apply sliding movement to prevent getting stuck
            if (!checkWallCollision(newX, newY, enemy.width, enemy.height)) {
              // No collision, move normally
              enemy.x = newX
              enemy.y = newY
            } else {
              // Collision detected, try sliding
              if (!checkWallCollision(collision.slideX, enemy.y, enemy.width, enemy.height)) {
                enemy.x = collision.slideX
              }
              if (!checkWallCollision(enemy.x, collision.slideY, enemy.width, enemy.height)) {
                enemy.y = collision.slideY
              }
            }
            
            // Additional safety check for enemies
            if (checkWallCollision(enemy.x, enemy.y, enemy.width, enemy.height)) {
              // Emergency: push enemy to nearest safe position
              let foundSafePosition = false
              for (let distance = 1; distance <= 30 && !foundSafePosition; distance++) {
                const directions = [
                  { x: enemy.x + distance, y: enemy.y },
                  { x: enemy.x - distance, y: enemy.y },
                  { x: enemy.x, y: enemy.y + distance },
                  { x: enemy.x, y: enemy.y - distance }
                ]
                
                for (const pos of directions) {
                  if (!checkWallCollision(pos.x, pos.y, enemy.width, enemy.height)) {
                    enemy.x = pos.x
                    enemy.y = pos.y
                    foundSafePosition = true
                    break
                  }
                }
              }
            }
          }
          
          // Attack player if in range
          if (distance < enemy.attackRange && Date.now() - enemy.lastAttack > enemy.attackCooldown) {
            attackPlayer(enemy)
            enemy.lastAttack = Date.now()
          }
        } else if (enemy.state === 'idle') {
          // Random wandering
          if (Math.random() < 0.01) {
            enemy.target = {
              x: enemy.x + (Math.random() - 0.5) * 200,
              y: enemy.y + (Math.random() - 0.5) * 200
            }
          }
          
          if (enemy.target) {
            const dx = enemy.target.x - enemy.x
            const dy = enemy.target.y - enemy.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance > 10) {
              const speed = enemy.speed * 0.5
              enemy.x += (dx / distance) * speed
              enemy.y += (dy / distance) * speed
            } else {
              enemy.target = null
            }
          }
        }
        
        // Regenerate enemy health slowly
        if (enemy.health < enemy.maxHealth && distance > enemy.detectionRange) {
          enemy.health = Math.min(enemy.maxHealth, enemy.health + 0.5 * deltaTime / 1000)
        }
      })
      
      // Remove dead enemies
      const deadEnemies = enemies.value.filter(enemy => enemy.health <= 0)
      deadEnemies.forEach(enemy => {
        addNotification(`Defeated ${enemy.name}! +${enemy.experience} XP`, 'success')
        player.xp += enemy.experience
        enemiesDefeated.value++
        statistics.totalKills++
        
        // Spawn death particles
        createParticles(enemy.x, enemy.y, 10, enemy.color)
        
        // Chance to drop item
        if (Math.random() < 0.3) {
          spawnItemAt(enemy.x, enemy.y)
        }
      })
      
      enemies.value = enemies.value.filter(enemy => enemy.health > 0)
    }
    
    const updateProjectiles = (deltaTime) => {
      projectiles.value.forEach(projectile => {
        // Move projectile
        projectile.x += projectile.dx * projectile.speed * deltaTime / 16
        projectile.y += projectile.dy * projectile.speed * deltaTime / 16
        
        // Update lifetime
        projectile.lifetime -= deltaTime
        
        // Check wall collisions
        if (checkWallCollision(projectile.x, projectile.y)) {
          projectile.lifetime = 0
          createParticles(projectile.x, projectile.y, 5, projectile.color)
        }
        
        // Check enemy collisions (if player projectile)
        if (projectile.owner === 'player') {
          enemies.value.forEach(enemy => {
            const dx = projectile.x - enemy.x
            const dy = projectile.y - enemy.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < (projectile.radius + enemy.width / 2)) {
              const damage = player.damage * (player.equippedWeapon?.damageMultiplier || 1)
              enemy.health -= damage
              projectile.lifetime = 0
              createParticles(projectile.x, projectile.y, 5, '#FF0000')
              addNotification(`Hit ${enemy.name} for ${Math.round(damage)} damage!`, 'combat')
            }
          })
        }
        
        // Check player collisions (if enemy projectile)
        if (projectile.owner === 'enemy') {
          const dx = projectile.x - player.x
          const dy = projectile.y - player.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < (projectile.radius + player.width / 2)) {
            let damage = projectile.damage
            if (player.isBlocking) {
              damage *= 0.3
              createParticles(player.x, player.y, 8, '#2196F3')
              addNotification('Blocked!', 'info')
            }
            player.health -= damage
            projectile.lifetime = 0
            createParticles(projectile.x, projectile.y, 5, '#FF0000')
            addNotification(`Took ${Math.round(damage)} damage!`, 'damage')
            
            // Screen shake effect
            screenShake(10)
          }
        }
      })
      
      // Remove expired projectiles
      projectiles.value = projectiles.value.filter(p => p.lifetime > 0)
    }
    
    const updateParticles = (deltaTime) => {
      particles.value.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= deltaTime
        particle.alpha = particle.life / 1000
        particle.vy += 0.1 // Gravity
      })
      
      particles.value = particles.value.filter(p => p.life > 0)
    }
    
    const updateCooldowns = (deltaTime) => {
      // Update status effects
      activeStatusEffects.value.forEach(effect => {
        if (effect.duration) {
          effect.duration = Math.max(0, effect.duration - deltaTime / 1000)
          
          if (effect.duration <= 0) {
            removeStatusEffect(effect.id)
          }
        }
      })
    }
    
    // ==========================================
    // 5. COLLISION DETECTION
    // ==========================================
    const checkWallCollision = (x, y, width = player.width, height = player.height) => {
      const halfWidth = width / 2
      const halfHeight = height / 2
      
      for (const wall of walls.value) {
        if (
          x + halfWidth > wall.x &&
          x - halfWidth < wall.x + wall.width &&
          y + halfHeight > wall.y &&
          y - halfHeight < wall.y + wall.height
        ) {
          return true
        }
      }
      return false
    }
    
    // Enhanced collision detection with sliding response
    const getWallCollisionResponse = (newX, newY, width = player.width, height = player.height) => {
      const halfWidth = width / 2
      const halfHeight = height / 2
      let collisionX = false
      let collisionY = false
      let slideX = newX
      let slideY = newY
      
      for (const wall of walls.value) {
        // Check if player would collide with this wall
        if (
          newX + halfWidth > wall.x &&
          newX - halfWidth < wall.x + wall.width &&
          newY + halfHeight > wall.y &&
          newY - halfHeight < wall.y + wall.height
        ) {
          // Calculate overlap on each axis
          const overlapLeft = (newX + halfWidth) - wall.x
          const overlapRight = (wall.x + wall.width) - (newX - halfWidth)
          const overlapTop = (newY + halfHeight) - wall.y
          const overlapBottom = (wall.y + wall.height) - (newY - halfHeight)
          
          // Find minimum overlap for sliding
          const minOverlapX = Math.min(overlapLeft, overlapRight)
          const minOverlapY = Math.min(overlapTop, overlapBottom)
          
          if (minOverlapX < minOverlapY) {
            // Horizontal collision is smaller, slide horizontally
            if (overlapLeft < overlapRight) {
              slideX = wall.x - halfWidth - 1 // Slide to left of wall
            } else {
              slideX = wall.x + wall.width + halfWidth + 1 // Slide to right of wall
            }
            collisionX = true
          } else {
            // Vertical collision is smaller, slide vertically
            if (overlapTop < overlapBottom) {
              slideY = wall.y - halfHeight - 1 // Slide above wall
            } else {
              slideY = wall.y + wall.height + halfHeight + 1 // Slide below wall
            }
            collisionY = true
          }
        }
      }
      
      return { collisionX, collisionY, slideX, slideY }
    }
    
    const checkCollisions = () => {
      // Check item collisions
      items.value.forEach(item => {
        if (!item.collected) {
          const dx = player.x - item.x
          const dy = player.y - item.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < (player.width / 2 + item.width / 2)) {
            collectItem(item)
          }
        }
      })
      
      // Check enemy-player collisions (for melee)
      if (player.attackCooldown <= 0) {
        enemies.value.forEach(enemy => {
          const dx = player.x - enemy.x
          const dy = player.y - enemy.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // If player is attacking and enemy is in range
          if (distance < 50) {
            // Check if player is facing the enemy
            const dotProduct = player.direction.x * dx + player.direction.y * dy
            if (dotProduct > 0) {
              // Enemy takes damage (handled in attack function)
            }
          }
        })
      }
    }
    
    const checkExit = () => {
      exits.value.forEach(exit => {
        const dx = player.x - (exit.x + exit.width / 2)
        const dy = player.y - (exit.y + exit.height / 2)
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 50) {
          if (player.inventory.some(item => item.type === 'key')) {
            nextFloor()
          } else {
            showDialog('Exit', 'The door is locked. You need a key to proceed.', 'locked')
          }
        }
      })
    }
    
    // ==========================================
    // 6. COMBAT SYSTEM
    // ==========================================
    const performAction = (action) => {
      switch (action) {
        case 'attack':
          if (player.attackCooldown <= 0) {
            attack()
            player.attackCooldown = 500 // 0.5 seconds cooldown
          }
          break
          
        case 'dash':
          if (player.stamina >= 30 && player.dashCooldown <= 0) {
            dash()
            player.stamina -= 30
            player.dashCooldown = 2000 // 2 seconds cooldown
            addNotification('Dashed!', 'info')
          }
          break
      }
    }
    
    const attack = () => {
      const damage = player.damage * (player.equippedWeapon?.damage || 1)
      
      // Check for enemies in attack range
      enemies.value.forEach(enemy => {
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 60) {
          // Check if enemy is in front of player
          const dotProduct = player.direction.x * dx + player.direction.y * dy
          if (dotProduct > 0) {
            enemy.health -= damage
            createParticles(enemy.x, enemy.y, 5, '#FF0000')
            addNotification(`Hit ${enemy.name} for ${Math.round(damage)} damage!`, 'combat')
            
            // Knockback effect
            const knockback = 10
            enemy.x -= player.direction.x * knockback
            enemy.y -= player.direction.y * knockback
            
            // Screen shake
            screenShake(5)
          }
        }
      })
      
      // Create attack particles
      createParticles(
        player.x + player.direction.x * 30,
        player.y + player.direction.y * 30,
        8,
        '#FFD700'
      )
      
      // Play attack sound effect
      playSFX('attack')
    }
    
    // Pastikan semua arrow function memiliki =>
const attackPlayer = (enemy) => {
  let damage = enemy.damage
  
  if (player.isBlocking) {
    damage *= 0.3 // Block reduces damage by 70%
    player.stamina -= 10
    createParticles(player.x, player.y, 5, '#2196F3')
  }
  
  player.health -= damage
  createParticles(player.x, player.y, 5, '#FF0000')
  
  // Knockback
  const dx = player.x - enemy.x
  const dy = player.y - enemy.y
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length > 0) {
    const knockback = 15
    player.x += (dx / length) * knockback
    player.y += (dy / length) * knockback
  }
  
  screenShake(15)
  playSFX('hit')
  
  // Check for player death
  if (player.health <= 0) {
    gameOver.value = true
    gameOverReason.value = 'death'
    statistics.totalDeaths++
    addNotification('You have been defeated!', 'damage')
  }
}

const startBlocking = () => {
  player.isBlocking = true
  player.speed = player.baseSpeed * 0.5
}

const stopBlocking = () => {
  player.isBlocking = false
  player.speed = player.baseSpeed
}

const dash = () => {
  player.isDashing = true
  const dashSpeed = 15
  const dashDuration = 200
  
  // Store dash destination
  const dashX = player.x + player.direction.x * dashSpeed * 5
  const dashY = player.y + player.direction.y * dashSpeed * 5
  
  // Animate dash
  let dashProgress = 0
  const dashInterval = setInterval(() => {
    dashProgress += 1
    
    player.x += player.direction.x * dashSpeed
    player.y += player.direction.y * dashSpeed
    
    // Create dash trail particles
    createParticles(player.x, player.y, 3, '#00FFFF')
    
    if (dashProgress >= 5) {
      clearInterval(dashInterval)
      player.isDashing = false
    }
  }, dashDuration / 5)
  
  playSFX('dash')
}
    
    // ==========================================
    // 7. ITEM SYSTEM
    // ==========================================
    const collectItem = (item) => {
      item.collected = true
      itemsCollected.value++
      statistics.itemsCollected++
      
      // Add to inventory
      const existingItem = player.inventory.find(i => i.name === item.name && i.type === item.type)
      
      if (existingItem && existingItem.quantity) {
        existingItem.quantity++
      } else {
        player.inventory.push({
          id: Date.now() + Math.random(),
          name: item.name,
          type: item.type,
          icon: item.icon,
          ...(item.healing && { healing: item.healing }),
          ...(item.damage && { damage: item.damage }),
          ...(item.defense && { defense: item.defense }),
          ...(item.value && { value: item.value }),
          quantity: 1,
          description: `A ${item.name.toLowerCase()}`
        })
      }
      
      // Remove from world
      items.value = items.value.filter(i => i.id !== item.id)
      
      // Create collection particles
      createParticles(item.x, item.y, 10, item.color)
      
      // Show notification
      addNotification(`Collected ${item.name}!`, 'item')
      playSFX('collect')
    }
    
    const spawnItemAt = (x, y) => {
      const itemTypes = [
        { name: 'Health Potion', type: 'potion', color: '#FF5252', icon: '🧪', healing: 20 },
        { name: 'Gold Coin', type: 'currency', color: '#FFD700', icon: '🪙', value: 5 }
      ]
      
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)]
      
      items.value.push({
        id: Date.now(),
        x: x,
        y: y,
        width: 20,
        height: 20,
        ...type,
        collected: false
      })
    }
    
    const useSelectedItem = () => {
      const item = selectedInventoryItem.value
      if (item) {
        useItem(item)
      }
    }
    
    const useItem = (item) => {
      switch (item.type) {
        case 'potion':
          if (item.healing) {
            player.health = Math.min(player.maxHealth, player.health + item.healing)
            addNotification(`Healed ${item.healing} HP!`, 'heal')
            createParticles(player.x, player.y, 15, '#FF5252')
          }
          break
          
        case 'weapon':
          equipItem(item)
          return
          
        case 'armor':
          equipItem(item)
          return
      }
      
      // Remove item from inventory
      if (item.quantity > 1) {
        item.quantity--
      } else {
        player.inventory = player.inventory.filter(i => i.id !== item.id)
        // Unequip if it was equipped
        if (item.equipped) {
          if (item.type === 'weapon') player.equippedWeapon = null
          if (item.type === 'armor') player.equippedArmor = null
        }
      }
      
      playSFX('use')
    }
    
    const equipItem = (item) => {
      // Unequip current item of same type
      player.inventory.forEach(i => {
        if (i.type === item.type && i.equipped) {
          i.equipped = false
        }
      })
      
      // Equip new item
      item.equipped = true
      
      if (item.type === 'weapon') {
        player.equippedWeapon = item
        player.damage = 10 * (item.damage || 1)
        addNotification(`Equipped ${item.name}!`, 'item')
      }
      
      if (item.type === 'armor') {
        player.equippedArmor = item
        player.defense = item.defense || 0
        addNotification(`Equipped ${item.name}!`, 'item')
      }
    }
    
    const dropItem = (item) => {
      // Remove from inventory
      player.inventory = player.inventory.filter(i => i.id !== item.id)
      
      // Unequip if equipped
      if (item.equipped) {
        if (item.type === 'weapon') player.equippedWeapon = null
        if (item.type === 'armor') player.equippedArmor = null
      }
      
      // Spawn item in world
      spawnItemAt(player.x, player.y)
      
      addNotification(`Dropped ${item.name}`, 'info')
    }
    
    // ==========================================
    // 8. VISUAL EFFECTS
    // ==========================================
    const createParticles = (x, y, count, color) => {
      for (let i = 0; i < count; i++) {
        particles.value.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          radius: Math.random() * 4 + 2,
          color: color,
          life: 1000,
          alpha: 1
        })
      }
    }
    
    const screenShake = (intensity) => {
      if (!gameCanvas.value) return
      
      const canvas = gameCanvas.value
      const originalX = canvas.style.left || '0px'
      const originalY = canvas.style.top || '0px'
      
      let shakeCount = 0
      const maxShakes = 5
      
      const shake = () => {
        if (shakeCount >= maxShakes) {
          canvas.style.left = originalX
          canvas.style.top = originalY
          return
        }
        
        const offsetX = (Math.random() - 0.5) * intensity
        const offsetY = (Math.random() - 0.5) * intensity
        
        canvas.style.left = `${offsetX}px`
        canvas.style.top = `${offsetY}px`
        
        shakeCount++
        setTimeout(shake, 50)
      }
      
      shake()
    }
    
    const addStatusEffect = (name, type, duration, icon) => {
      const effect = {
        id: Date.now(),
        name,
        type,
        duration,
        icon,
        description: `${name} effect`
      }
      
      activeStatusEffects.value.push(effect)
      
      // Remove after duration
      if (duration) {
        setTimeout(() => {
          removeStatusEffect(effect.id)
        }, duration * 1000)
      }
    }
    
    const removeStatusEffect = (id) => {
      activeStatusEffects.value = activeStatusEffects.value.filter(effect => effect.id !== id)
    }
    
    // ==========================================
    // 9. RENDERING
    // ==========================================
    const renderGame = () => {
      try {
        const canvas = gameCanvas.value
        if (!canvas) return
        
        const ctx = canvas.getContext('2d')
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Calculate camera position
      const cameraX = player.x - canvas.width / 2
      const cameraY = player.y - canvas.height / 2
      
      // Save context for camera transform
      ctx.save()
      ctx.translate(-cameraX, -cameraY)
      
      // Draw floor tiles
      floors.value.forEach(floor => {
        ctx.fillStyle = '#2d3047'
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height)
        
        // Draw floor pattern
        ctx.strokeStyle = '#3a3d5c'
        ctx.lineWidth = 1
        ctx.strokeRect(floor.x + 2, floor.y + 2, floor.width - 4, floor.height - 4)
      })
      
      // Draw walls
      walls.value.forEach(wall => {
        // Wall shadow
        ctx.fillStyle = '#16213e'
        ctx.fillRect(wall.x + 2, wall.y + 2, wall.width, wall.height)
        
        // Wall main color
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height)
        
        // Wall texture
        ctx.strokeStyle = '#0f3460'
        ctx.lineWidth = 2
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height)
        
        // Wall details
        ctx.fillStyle = '#0f3460'
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (Math.random() > 0.7) {
              const detailX = wall.x + 8 + i * 16
              const detailY = wall.y + 8 + j * 16
              ctx.fillRect(detailX, detailY, 4, 4)
            }
          }
        }
      })
      
      // Draw exit
      exits.value.forEach(exit => {
        // Exit glow
        ctx.shadowColor = exit.color
        ctx.shadowBlur = 15
        ctx.fillStyle = exit.color
        ctx.fillRect(exit.x, exit.y, exit.width, exit.height)
        ctx.shadowBlur = 0
        
        // Exit pattern
        ctx.fillStyle = '#FFA500'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🚪', exit.x + exit.width / 2, exit.y + exit.height / 2)
      })
      
      // Draw items
      items.value.forEach(item => {
        if (!item.collected) {
          // Item glow
          ctx.shadowColor = item.color
          ctx.shadowBlur = 10
          
          // Item background
          ctx.fillStyle = item.color
          ctx.beginPath()
          ctx.arc(item.x, item.y, item.width / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // Item icon
          ctx.shadowBlur = 0
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(item.icon, item.x, item.y)
          
          // Pulsing animation
          const pulse = Math.sin(Date.now() / 500) * 2
          ctx.strokeStyle = item.color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(item.x, item.y, item.width / 2 + pulse, 0, Math.PI * 2)
          ctx.stroke()
        }
      })
      
      // Draw enemies
      enemies.value.forEach(enemy => {
        // Enemy shadow
        ctx.shadowColor = '#000000'
        ctx.shadowBlur = 5
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        
        // Enemy body
        ctx.fillStyle = enemy.color
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, enemy.width / 2, 0, Math.PI * 2)
        ctx.fill()
        
        // Enemy icon
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(enemy.icon, enemy.x, enemy.y)
        
        // Enemy health bar
        const healthWidth = 40
        const healthHeight = 6
        const healthX = enemy.x - healthWidth / 2
        const healthY = enemy.y - enemy.height / 2 - 10
        
        // Health bar background
        ctx.fillStyle = '#333333'
        ctx.fillRect(healthX, healthY, healthWidth, healthHeight)
        
        // Health bar fill
        const healthPercent = enemy.health / enemy.maxHealth
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336'
        ctx.fillRect(healthX, healthY, healthWidth * healthPercent, healthHeight)
        
        // Health bar border
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1
        ctx.strokeRect(healthX, healthY, healthWidth, healthHeight)
        
        // Enemy name
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '10px Arial'
        ctx.fillText(enemy.name, enemy.x, enemy.y - enemy.height / 2 - 20)
      })
      
      // Draw player
      ctx.save()
      
      // Player shadow
      ctx.shadowColor = '#000000'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 3
      ctx.shadowOffsetY = 3
      
      // Player body
      ctx.fillStyle = player.isBlocking ? '#2196F3' : '#E91E63'
      ctx.beginPath()
      ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2)
      ctx.fill()
      
      // Player direction indicator
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(player.x, player.y)
      ctx.lineTo(
        player.x + player.direction.x * 20,
        player.y + player.direction.y * 20
      )
      ctx.stroke()
      
      // Player icon
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(player.isBlocking ? '🛡️' : '🧑', player.x, player.y)
      
      // Dash effect
      if (player.isDashing) {
        ctx.globalAlpha = 0.5
        ctx.fillStyle = '#00FFFF'
        ctx.beginPath()
        ctx.arc(player.x, player.y, player.width, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
      
      ctx.restore()
      
      // Draw projectiles
      projectiles.value.forEach(projectile => {
        ctx.shadowColor = projectile.color
        ctx.shadowBlur = 10
        ctx.fillStyle = projectile.color
        ctx.beginPath()
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })
      
      // Draw particles
      particles.value.forEach(particle => {
        ctx.globalAlpha = particle.alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      })
      
      // Restore context
      ctx.restore()
      
      // Draw HUD elements on top
      drawHUD(ctx)
      } catch (error) {
        console.error('Render error:', error)
      }
    }
    
    const drawHUD = (ctx) => {
      const canvas = gameCanvas.value
      if (!canvas) return
      
      // Draw player health bar
      const healthBarWidth = 200
      const healthBarHeight = 20
      const healthBarX = 20
      const healthBarY = 20
      
      // Health bar background
      ctx.fillStyle = '#333333'
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)
      
      // Health bar fill
      const healthPercent = player.health / player.maxHealth
      ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336'
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight)
      
      // Health bar border
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)
      
      // Health text
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '14px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        `HP: ${Math.ceil(player.health)}/${player.maxHealth}`,
        healthBarX + 5,
        healthBarY + healthBarHeight / 2
      )
      
      // Draw stamina bar
      const staminaBarY = healthBarY + healthBarHeight + 10
      
      // Stamina bar background
      ctx.fillStyle = '#333333'
      ctx.fillRect(healthBarX, staminaBarY, healthBarWidth, healthBarHeight)
      
      // Stamina bar fill
      const staminaPercent = player.stamina / player.maxStamina
      ctx.fillStyle = staminaPercent > 0.5 ? '#2196F3' : staminaPercent > 0.25 ? '#1976D2' : '#0D47A1'
      ctx.fillRect(healthBarX, staminaBarY, healthBarWidth * staminaPercent, healthBarHeight)
      
      // Stamina bar border
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(healthBarX, staminaBarY, healthBarWidth, healthBarHeight)
      
      // Stamina text
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(
        `STA: ${Math.ceil(player.stamina)}/${player.maxStamina}`,
        healthBarX + 5,
        staminaBarY + healthBarHeight / 2
      )
      
      // Draw XP bar
      const xpBarY = staminaBarY + healthBarHeight + 10
      
      // XP bar background
      ctx.fillStyle = '#333333'
      ctx.fillRect(healthBarX, xpBarY, healthBarWidth, healthBarHeight)
      
      // XP bar fill
      const xpPercent = (player.xp % 100) / 100
      ctx.fillStyle = '#9C27B0'
      ctx.fillRect(healthBarX, xpBarY, healthBarWidth * xpPercent, healthBarHeight)
      
      // XP bar border
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(healthBarX, xpBarY, healthBarWidth, healthBarHeight)
      
      // XP text
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(
        `Level ${player.level} - XP: ${player.xp}/${player.level * 100}`,
        healthBarX + 5,
        xpBarY + healthBarHeight / 2
      )
      
      // Draw equipped items
      const equippedY = xpBarY + healthBarHeight + 20
      
      if (player.equippedWeapon) {
        ctx.fillStyle = '#795548'
        ctx.fillRect(healthBarX, equippedY, 30, 30)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '16px Arial'
        ctx.fillText(player.equippedWeapon.icon, healthBarX + 15, equippedY + 15)
      }
      
      if (player.equippedArmor) {
        ctx.fillStyle = '#607D8B'
        ctx.fillRect(healthBarX + 40, equippedY, 30, 30)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '16px Arial'
        ctx.fillText(player.equippedArmor.icon, healthBarX + 55, equippedY + 15)
      }
      
      // Draw floor info
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '16px Arial'
      ctx.textAlign = 'right'
      ctx.fillText(
        `Floor: ${currentFloor.value}`,
        canvas.width - 20,
        40
      )
      ctx.fillText(
        `Enemies: ${enemies.value.length}`,
        canvas.width - 20,
        70
      )
      ctx.fillText(
        `Time: ${formatTime(gameTime.value)}`,
        canvas.width - 20,
        100
      )
      
      // Draw controls hint
      if (showTutorial.value) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(canvas.width / 2 - 150, canvas.height - 100, 300, 80)
        
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(
          isMobile.value ? 'Use joystick to move' : 'Use WASD to move',
          canvas.width / 2,
          canvas.height - 70
        )
        ctx.fillText(
          'Attack with ⚔️ button',
          canvas.width / 2,
          canvas.height - 45
        )
      }
      
      // Draw game over screen
      if (gameOver.value) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          gameOverReason.value === 'death' ? 'YOU DIED' : 'VICTORY!',
          canvas.width / 2,
          canvas.height / 2 - 50
        )
        
        ctx.font = '24px Arial'
        ctx.fillText(
          `Floor ${currentFloor.value} • ${enemiesDefeated.value} Enemies • ${formatTime(gameTime.value)}`,
          canvas.width / 2,
          canvas.height / 2 + 20
        )
      }
    }
    
    // ==========================================
    // 10. INPUT HANDLING
    // ==========================================
    const keyDown = (key) => {
      keys[key] = true
    }
    
    const keyUp = (key) => {
      keys[key] = false
    }
    
    const startJoystick = (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      joystickActive.value = true
      joystickTouchId.value = touch.identifier
    }
    
    const updateJoystick = (event) => {
      if (!joystickActive.value) return
      
      event.preventDefault()
      const touch = Array.from(event.touches).find(t => t.identifier === joystickTouchId.value)
      if (!touch) return
      
      const baseRect = joystickBase.value.getBoundingClientRect()
      const baseX = baseRect.left + baseRect.width / 2
      const baseY = baseRect.top + baseRect.height / 2
      
      const deltaX = touch.clientX - baseX
      const deltaY = touch.clientY - baseY
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDistance = 50
      
      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX)
        joystickPosition.x = Math.cos(angle) * maxDistance
        joystickPosition.y = Math.sin(angle) * maxDistance
      } else {
        joystickPosition.x = deltaX
        joystickPosition.y = deltaY
      }
    }
    
    const endJoystick = () => {
      joystickActive.value = false
      joystickPosition.x = 0
      joystickPosition.y = 0
      joystickTouchId.value = null
    }
    
    // ==========================================
    // 11. GAME MANAGEMENT
    // ==========================================
    const startNewGame = () => {
      statistics.gamesPlayed++
      player.level = 1
      player.xp = 0
      player.health = 100
      player.stamina = 100
      currentFloor.value = 1
      initGame()
    }
    
    const continueGame = () => {
      loadGame()
    }
    
    const nextFloor = () => {
      gameOver.value = false
      currentFloor.value++
      
      const config = levelConfigs[Math.min(currentFloor.value - 1, levelConfigs.length - 1)]
      
      addNotification(`${config.name}!`, 'success')
      
      // Level up check
      if (player.xp >= player.level * 100) {
        levelUp()
      }
      
      // Generate new maze
      generateMaze()
      spawnPlayer()
      spawnEnemies(config.enemyCount)
      spawnItems(config.itemCount)
      spawnExit()
      
      // Heal player a bit
      player.health = Math.min(player.maxHealth, player.health + 20)
      player.stamina = player.maxStamina
    }
    
    const levelUp = () => {
      player.level++
      player.xp = 0
      
      // Increase stats
      player.maxHealth += 20
      player.health = player.maxHealth
      player.maxStamina += 10
      player.stamina = player.maxStamina
      player.damage += 2
      player.baseSpeed += 0.1
      player.speed = player.baseSpeed
      
      statistics.highestLevel = Math.max(statistics.highestLevel, player.level)
      
      addNotification(`Level Up! Now level ${player.level}`, 'level')
      createParticles(player.x, player.y, 20, '#FFD700')
      screenShake(20)
      playSFX('levelup')
    }
    
    const confirmNextLevel = () => {
      showLevelComplete.value = false
      gamePaused.value = false
      nextFloor()
    }
    
    const backToMenuFromLevel = () => {
      showLevelComplete.value = false
      gamePaused.value = false
      showMainMenu.value = true
    }

    const retryGame = () => {
      gameOver.value = false
      startNewGame()
    }
    
    const quitToMenu = () => {
      gameOver.value = false
      showMainMenu.value = true
      showInventory.value = false
      showMobileMenu.value = false
    }
    
    const exitGame = () => {
      saveGame()
      // In a real app, you might want to close the window or navigate away
      addNotification('Game saved. Thanks for playing!', 'info')
    }
    
    // ==========================================
    // 12. SAVE/LOAD SYSTEM
    // ==========================================
    const saveGame = () => {
      try {
        const saveData = {
          player: {
            x: player.x,
            y: player.y,
            level: player.level,
            xp: player.xp,
            health: player.health,
            maxHealth: player.maxHealth,
            stamina: player.stamina,
            maxStamina: player.maxStamina,
            speed: player.speed,
            baseSpeed: player.baseSpeed,
            damage: player.damage,
            defense: player.defense,
            direction: player.direction,
            inventory: player.inventory,
            equippedWeapon: player.equippedWeapon,
            equippedArmor: player.equippedArmor
          },
          game: {
            currentFloor: currentFloor.value,
            gameTime: gameTime.value,
            enemiesDefeated: enemiesDefeated.value,
            itemsCollected: itemsCollected.value,
            gameDifficulty: gameDifficulty.value,
            musicVolume: musicVolume.value,
            sfxVolume: sfxVolume.value,
            musicEnabled: musicEnabled.value,
            sfxEnabled: sfxEnabled.value,
            showMinimap: showMinimap.value
          },
          statistics: statistics,
          timestamp: Date.now(),
          version: '1.0'
        }
        
        localStorage.setItem('dungeon_maze_save', JSON.stringify(saveData))
        addNotification('Game saved successfully!', 'success')
        console.log('Game saved:', saveData)
      } catch (error) {
        console.error('Error saving game:', error)
        addNotification('Failed to save game', 'error')
      }
    }
    
    const loadGame = () => {
      try {
        const saveData = localStorage.getItem('dungeon_maze_save')
        if (saveData) {
          const data = JSON.parse(saveData)
          
          // Validate save data
          if (!data.player || !data.game) {
            throw new Error('Invalid save data format')
          }
          
          // Load player data
          Object.assign(player, data.player)
          
          // Load game data
          currentFloor.value = data.game.currentFloor
          gameTime.value = data.game.gameTime
          enemiesDefeated.value = data.game.enemiesDefeated
          itemsCollected.value = data.game.itemsCollected
          gameDifficulty.value = data.game.gameDifficulty || 'normal'
          musicVolume.value = data.game.musicVolume || 50
          sfxVolume.value = data.game.sfxVolume || 70
          musicEnabled.value = data.game.musicEnabled !== undefined ? data.game.musicEnabled : true
          sfxEnabled.value = data.game.sfxEnabled !== undefined ? data.game.sfxEnabled : true
          showMinimap.value = data.game.showMinimap !== undefined ? data.game.showMinimap : true
          
          // Load statistics
          if (data.statistics) {
            Object.assign(statistics, data.statistics)
          }
          
          // Hide main menu and initialize game
          showMainMenu.value = false
          initGame()
          
          addNotification('Game loaded successfully!', 'success')
          console.log('Game loaded:', data)
        } else {
          addNotification('No save data found', 'info')
        }
      } catch (error) {
        console.error('Error loading game:', error)
        addNotification('Failed to load game: ' + error.message, 'error')
      }
    }
    
    // ==========================================
    // 13. UI HELPERS
    // ==========================================
    const addNotification = (text, type) => {
      const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        damage: '💥',
        heal: '💚',
        item: '🎁',
        level: '🌟',
        combat: '⚔️',
        save: '💾'
      }
      
      const id = ++notificationId.value
      notifications.value.push({
        id,
        text,
        type,
        icon: icons[type] || 'ℹ️'
      })
      
      setTimeout(() => {
        removeNotification(id)
      }, 3000)
    }
    
    const removeNotification = (id) => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }
    
    const showDialog = (character, text, emotion) => {
      activeDialog.value = { character, emotion }
      dialogText.value = text
      dialogIndex.value = 0
    }
    
    const nextDialogLine = () => {
      activeDialog.value = null
    }
    
    const toggleInventory = () => {
      showInventory.value = !showInventory.value
    }
    
    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
    }
    
    const hideTutorial = () => {
      showTutorial.value = false
      localStorage.setItem('dungeon_tutorial_seen', 'true')
    }
    
    const setDifficulty = (difficulty) => {
      const oldDifficulty = gameDifficulty.value
      gameDifficulty.value = difficulty
      
      const diff = difficulties.find(d => d.id === difficulty)
      if (diff) {
        addNotification(`Difficulty set to ${diff.name}`, 'info')
        console.log(`Difficulty changed from ${oldDifficulty} to ${difficulty}`)
        console.log(`Enemy multiplier: ${diff.enemyMultiplier}, Damage multiplier: ${diff.damageMultiplier}`)
        
        // Apply difficulty settings to existing enemies if game is active
        if (!showMainMenu.value && enemies.value.length > 0) {
          enemies.value.forEach(enemy => {
            const baseHealth = enemy.maxHealth / (oldDifficulty ? difficulties.find(d => d.id === oldDifficulty)?.enemyMultiplier || 1 : 1)
            const baseDamage = enemy.damage / (oldDifficulty ? difficulties.find(d => d.id === oldDifficulty)?.damageMultiplier || 1 : 1)
            
            enemy.maxHealth = baseHealth * diff.enemyMultiplier
            enemy.health = Math.min(enemy.health, enemy.maxHealth)
            enemy.damage = baseDamage * diff.damageMultiplier
          })
          addNotification('Enemy stats updated!', 'info')
        }
      }
    }
    
    const selectQuickSlot = (index) => {
      selectedQuickSlot.value = index
    }
    
    const clearQuickSlot = (index) => {
      quickSlots.value[index].item = null
    }
    
    // ==========================================
    // 14. UTILITY FUNCTIONS
    // ==========================================
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    const playSFX = (type) => {
      if (!sfxEnabled.value) return
      
      // Create audio context for sound effects
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Different sound types
        switch(type) {
          case 'attack':
            oscillator.frequency.value = 200
            gainNode.gain.value = sfxVolume.value / 1000
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.1)
            break
          case 'hit':
            oscillator.frequency.value = 100
            gainNode.gain.value = sfxVolume.value / 800
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.2)
            break
          case 'pickup':
            oscillator.frequency.value = 800
            gainNode.gain.value = sfxVolume.value / 1000
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.1)
            break
          case 'levelup':
            oscillator.frequency.value = 400
            gainNode.gain.value = sfxVolume.value / 1000
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2)
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.3)
            break
          default:
            oscillator.frequency.value = 440
            gainNode.gain.value = sfxVolume.value / 1000
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.1)
        }
      } catch (error) {
        console.log(`Playing SFX: ${type} at volume ${sfxVolume.value}`)
      }
    }
    
    const toggleMusic = () => {
      musicEnabled.value = !musicEnabled.value
      if (musicEnabled.value) {
        // Start background music (simple loop)
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.type = 'sine'
          oscillator.frequency.value = 220
          gainNode.gain.value = musicVolume.value / 10000
          
          oscillator.start()
          // Store reference for stopping later
          window.gameMusicOscillator = oscillator
          window.gameMusicGainNode = gainNode
          window.gameMusicContext = audioContext
        } catch (error) {
          console.log('Music started (simulated)')
        }
      } else {
        // Stop music
        try {
          if (window.gameMusicOscillator) {
            window.gameMusicOscillator.stop()
            window.gameMusicOscillator = null
            window.gameMusicGainNode = null
            window.gameMusicContext = null
          }
        } catch (error) {
          console.log('Music stopped (simulated)')
        }
      }
      addNotification(`Music ${musicEnabled.value ? 'enabled' : 'disabled'}`, 'info')
    }
    
    const toggleSFX = () => {
      sfxEnabled.value = !sfxEnabled.value
      addNotification(`SFX ${sfxEnabled.value ? 'enabled' : 'disabled'}`, 'info')
    }
    
    const shareScore = () => {
      const text = `I reached Floor ${currentFloor.value} and defeated ${enemiesDefeated.value} enemies in Dungeon Maze!`
      
      if (navigator.share) {
        navigator.share({
          title: 'Dungeon Maze Score',
          text: text,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(text)
        addNotification('Score copied to clipboard!', 'success')
      }
    }
    
    // ==========================================
    // 15. LIFECYCLE HOOKS
    // ==========================================
    onMounted(() => {
      // Check if mobile
      isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      // Check initial orientation
      isPortrait.value = window.innerHeight > window.innerWidth
      
      // Listen for orientation changes
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          isPortrait.value = window.innerHeight > window.innerWidth
          
          // Update canvas size after orientation change
          const canvas = gameCanvas.value
          if (canvas) {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
          }
        }, 100)
      })
      
      // Try to lock orientation to landscape on mobile
      if (isMobile.value && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape-primary').catch(() => {
          // Orientation lock not supported or failed
          console.log('Orientation lock not supported')
        })
      }
      
      // Initialize canvas
      const canvas = gameCanvas.value
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        
        // Start game loop
        animationFrameId = requestAnimationFrame(gameLoop)
      }
      
      // Load tutorial state
      showTutorial.value = !localStorage.getItem('dungeon_tutorial_seen')
      
      // Load statistics
      const savedStats = localStorage.getItem('dungeon_statistics')
      if (savedStats) {
        Object.assign(statistics, JSON.parse(savedStats))
      }
      
      // Set up keyboard listeners
      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase()
        if (['w', 'a', 's', 'd'].includes(key)) {
          e.preventDefault()
          keys[key] = true
        }
        
        // Space for attack
        if (e.key === ' ' && !isMobile.value) {
          e.preventDefault()
          performAction('attack')
        }
        
        // E for inventory
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault()
          toggleInventory()
        }
        
        // Escape for menu
        if (e.key === 'Escape') {
          e.preventDefault()
          showMainMenu.value = !showMainMenu.value
        }
      })
      
      window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase()
        if (['w', 'a', 's', 'd'].includes(key)) {
          keys[key] = false
        }
      })
      
      // Handle window resize
      window.addEventListener('resize', () => {
        if (gameCanvas.value) {
          gameCanvas.value.width = window.innerWidth
          gameCanvas.value.height = window.innerHeight
        }
      })
      
      // Prevent context menu on game canvas
      canvas?.addEventListener('contextmenu', (e) => {
        e.preventDefault()
      })
    })
    
    onUnmounted(() => {
      // Clean up game loop
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      
      // Save statistics
      localStorage.setItem('dungeon_statistics', JSON.stringify(statistics))
    })
    
    // ==========================================
    // 16. RETURN ALL REACTIVE PROPERTIES
    // ==========================================
    return {
      // Refs
      gameCanvas,
      joystickBase,
      
      // State
      isMobile,
      loading,
      loadingProgress,
      gameOver,
      gameOverReason,
      showMainMenu,
      showInventory,
      showMobileMenu,
      showMinimap,
      showTutorial,
      showLevelComplete,
      
      // Game data
      player,
      minimapTiles,
      gameTime,
      currentFloor,
      enemiesDefeated,
      itemsCollected,
      
      // Input
      keys,
      joystickPosition,
      selectedQuickSlot,
      
      // UI
      notifications,
      activeStatusEffects,
      activeDialog,
      dialogText,
      quickSlots,
      selectedInventoryItem,
      
      // Settings
      gameDifficulty,
      difficulties,
      musicVolume,
      sfxVolume,
      musicEnabled,
      sfxEnabled,
      statistics,
      
      // Computed
      hasSaveData,
      
      // Methods
      startNewGame,
      continueGame,
      confirmNextLevel,
      backToMenuFromLevel,
      toggleInventory,
      toggleMobileMenu,
      hideTutorial,
      setDifficulty,
      performAction,
      useSelectedItem,
      startBlocking,
      stopBlocking,
      selectQuickSlot,
      clearQuickSlot,
      retryGame,
      quitToMenu,
      exitGame,
      saveGame,
      loadGame,
      toggleMusic,
      toggleSFX,
      shareScore,
      
      // Input handlers
      keyDown,
      keyUp,
      startJoystick,
      updateJoystick,
      endJoystick,
      
      // Utility
      formatTime,
      isTileVisible
    }
  }
}
</script>

<style>
/* ==========================================
   GLOBAL STYLES
   ========================================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

body {
  background: #000;
  overflow: hidden;
  font-family: 'Arial', sans-serif;
  touch-action: none;
}

.game-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.portrait-rotate {
  transform: rotate(90deg);
  transform-origin: center;
  width: 100vh !important;
  height: 100vw !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) rotate(90deg) !important;
}

.mobile-view .game-canvas {
  touch-action: none;
}

/* ==========================================
   GAME CANVAS
   ========================================== */
.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  cursor: default;
}

/* ==========================================
   MINIMAP
   ========================================== */
.minimap {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 200px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #4CAF50;
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
}

.minimap-content {
  padding: 10px;
}

.minimap-grid {
  display: grid;
  grid-template-rows: repeat(auto-fill, 4px);
  gap: 1px;
}

.minimap-row {
  display: flex;
  gap: 1px;
}

.minimap-tile {
  width: 4px;
  height: 4px;
  border-radius: 1px;
}

.minimap-tile.wall {
  background: #333;
}

.minimap-tile.floor {
  background: #666;
}

.minimap-tile.player {
  background: #E91E63;
  box-shadow: 0 0 3px #E91E63;
}

.minimap-tile.enemy {
  background: #F44336;
  box-shadow: 0 0 3px #F44336;
}

.minimap-tile.item {
  background: #FFD700;
  box-shadow: 0 0 3px #FFD700;
}

.minimap-tile.exit {
  background: #4CAF50;
  box-shadow: 0 0 3px #4CAF50;
}

.minimap-tile.fog {
  background: #222;
}

/* ==========================================
   HUD ELEMENTS
   ========================================== */
.game-hud {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
}

.health-bar, .stamina-bar, .xp-bar {
  width: 300px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #000;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  position: relative;
}

@media (max-width: 768px) {
  .health-bar, .stamina-bar, .xp-bar {
    width: 200px;
    height: 20px;
  }
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.stamina-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196F3, #03A9F4);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #9C27B0, #E91E63);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.health-text, .stamina-text, .xp-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 1px 1px 2px black;
}

.status-effects {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.status-effect {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  position: relative;
  border: 2px solid transparent;
}

.status-effect.poison {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  border-color: #4CAF50;
}

.status-effect.buff {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  border-color: #FF9800;
}

.status-effect.debuff {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  border-color: #F44336;
}

.effect-timer {
  position: absolute;
  bottom: -5px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 2px 4px;
  border-radius: 3px;
}

/* ==========================================
   QUICK INVENTORY
   ========================================== */
.quick-inventory {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 100;
}

.quick-slot {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #555;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-slot:hover, .quick-slot.active {
  border-color: #4CAF50;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.quick-slot.empty {
  color: #666;
  font-size: 18px;
}

.slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.slot-quantity {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
}

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

/* ==========================================
   MOBILE CONTROLS
   ========================================== */
.mobile-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: clamp(150px, 25vh, 200px);
  z-index: 100;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: clamp(10px, 2vh, 20px);
}

.mobile-controls > * {
  pointer-events: auto;
}

.joystick-container {
  position: relative;
  width: clamp(100px, 20vw, 150px);
  height: clamp(100px, 20vw, 150px);
}

.joystick-base {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  position: relative;
  touch-action: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.joystick-thumb {
  width: clamp(40px, 8vw, 60px);
  height: clamp(40px, 8vw, 60px);
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.mobile-actions {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.5vh, 15px);
  width: clamp(180px, 35vw, 250px);
}

.mobile-action-row {
  display: flex;
  justify-content: flex-end;
  gap: clamp(8px, 1.5vw, 15px);
}

.mobile-btn {
  width: clamp(50px, 10vw, 70px);
  height: clamp(50px, 10vw, 70px);
  border-radius: 50%;
  border: none;
  font-size: clamp(20px, 4vw, 32px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  touch-action: manipulation;
}

.mobile-btn:active {
  transform: scale(0.85);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.mobile-btn.attack {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  color: white;
}

.mobile-btn.block {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.mobile-btn.dash {
  background: linear-gradient(135deg, #00BCD4, #0097A7);
  color: white;
}

.mobile-btn.use {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
}

.mobile-btn.menu {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
}

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
   MOBILE CONTROLS (REVISED)
   ========================================== */
.mobile-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  z-index: 150;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 15px;
  background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%);
}

.mobile-controls > * {
  pointer-events: auto;
}

.joystick-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.joystick-base {
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  border: 3px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  position: relative;
  touch-action: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.joystick-thumb {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.9);
  border: 2px solid rgba(255,255,255,0.6);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.mobile-actions {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 10px;
  width: 160px;
  height: 150px;
}

.mobile-action-row {
  display: contents;
}

.mobile-btn {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: none;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  touch-action: manipulation;
}

.mobile-btn:active {
  transform: scale(0.85);
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
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
  border-radius: 25px;
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
   ORIENTATION SPECIFIC STYLES (NEW)
   ========================================== */
@media (orientation: landscape) {
  .mobile-controls {
    height: 140px;
    padding: 10px;
  }
  
  .joystick-container {
    width: 100px;
    height: 100px;
  }
  
  .mobile-actions {
    width: 140px;
    height: 120px;
    gap: 8px;
  }
  
  .mobile-btn {
    font-size: 20px;
  }
  
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
  .mobile-controls {
    height: 200px;
    padding: 20px;
  }
  
  .joystick-container {
    width: 140px;
    height: 140px;
  }
  
  .mobile-actions {
    width: 180px;
    height: 160px;
    gap: 12px;
  }
  
  .mobile-btn {
    font-size: 28px;
  }
  
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

/* ==========================================
   DIALOG SYSTEM
   ========================================== */
.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}

.dialog-box {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  border: 3px solid #3498db;
  border-radius: 15px;
  padding: 20px;
  max-width: 600px;
  width: 100%;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: dialog-appear 0.3s ease;
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
}

.dialog-character {
  font-size: 24px;
  font-weight: bold;
  color: #3498db;
}

.dialog-emotion {
  font-size: 20px;
}

.dialog-text {
  font-size: 18px;
  line-height: 1.5;
  margin-bottom: 15px;
  min-height: 60px;
}

.dialog-indicator {
  text-align: center;
  font-size: 24px;
  color: #3498db;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}

/* ==========================================
   MAIN MENU
   ========================================== */
.main-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.main-menu {
  background: rgba(0, 0, 0, 0.8);
  border: 3px solid #4CAF50;
  border-radius: 20px;
  padding: clamp(20px, 4vw, 30px);
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  color: white;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  animation: menu-appear 0.5s ease;
  overflow-y: auto;
}

@keyframes menu-appear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.game-title {
  font-size: clamp(32px, 6vw, 48px);
  text-align: center;
  margin-bottom: 30px;
  color: #4CAF50;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  font-family: 'Arial Black', sans-serif;
  letter-spacing: 2px;
}

.menu-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #444;
}

.menu-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.menu-section h3 {
  color: #4CAF50;
  margin-bottom: 15px;
  font-size: 20px;
}

.menu-btn {
  width: 100%;
  padding: 15px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #333, #555);
  border: 2px solid #666;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #444, #666);
  border-color: #4CAF50;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.menu-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-btn.exit {
  background: linear-gradient(135deg, #F44336, #D32F2F);
  border-color: #F44336;
}

.menu-icon {
  font-size: 24px;
}

.difficulty-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.diff-btn {
  flex: 1;
  padding: 12px;
  background: #333;
  border: 2px solid #555;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.diff-btn:hover, .diff-btn.active {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.settings-grid {
  display: grid;
  gap: 15px;
}

.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.setting span {
  color: #ccc;
  font-size: 16px;
}

.setting input[type="range"] {
  flex: 1;
  max-width: 200px;
  height: 8px;
  background: #333;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
}

.setting input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #333;
  border-radius: 24px;
  transition: .4s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked + .toggle-slider {
  background-color: #4CAF50;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.stat-list {
  display: grid;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.stat-item:last-child {
  border-bottom: none;
}

.menu-footer {
  margin-top: 30px;
}

/* ==========================================
   MOBILE MENU
   ========================================== */
.mobile-menu-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.mobile-menu {
  background: #1a1a2e;
  border: 2px solid #4CAF50;
  border-radius: 15px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  color: white;
}

.mobile-menu-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: #F44336;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.mobile-menu-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.mobile-menu-item {
  padding: 15px;
  background: #333;
  border: 2px solid #555;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-menu-item:hover {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.mobile-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #444;
}

.mobile-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.mobile-setting span {
  color: #ccc;
  font-size: 16px;
}

.mobile-setting input[type="range"] {
  flex: 1;
  max-width: 150px;
}

.mobile-toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.mobile-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.mobile-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #333;
  border-radius: 20px;
  transition: .4s;
}

.mobile-toggle-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

.mobile-toggle input:checked + .mobile-toggle-slider {
  background-color: #4CAF50;
}

.mobile-toggle input:checked + .mobile-toggle-slider:before {
  transform: translateX(20px);
}

/* ==========================================
   INVENTORY
   ========================================== */
.inventory-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.inventory-container {
  background: #1a1a2e;
  border: 3px solid #9C27B0;
  border-radius: 15px;
  padding: 20px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #9C27B0;
}

.inventory-header h2 {
  color: #9C27B0;
  font-size: 28px;
}

.close-inventory {
  width: 40px;
  height: 40px;
  background: #F44336;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.inventory-item-slot {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #555;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 100px;
}

.inventory-item-slot:hover, .inventory-item-slot.selected {
  border-color: #9C27B0;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(156, 39, 176, 0.3);
}

.inventory-item-slot.weapon {
  border-color: #795548;
}

.inventory-item-slot.potion {
  border-color: #F44336;
}

.inventory-item-slot.key {
  border-color: #FF9800;
}

.inventory-item-slot.armor {
  border-color: #607D8B;
}

.item-icon {
  font-size: 32px;
  margin-bottom: 5px;
}

.item-name {
  font-size: 12px;
  text-align: center;
  word-break: break-word;
}

.item-quantity {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
}

.item-equipped {
  position: absolute;
  top: 5px;
  left: 5px;
  background: #4CAF50;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
}

.inventory-slot.empty {
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed #555;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  min-height: 100px;
}

.inventory-info {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
}

.inventory-info h3 {
  color: #9C27B0;
  margin-bottom: 10px;
}

.inventory-info p {
  color: #ccc;
  margin-bottom: 15px;
  line-height: 1.5;
}

.item-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.item-stat {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

.item-stat span:first-child {
  color: #ccc;
}

.stat-value {
  color: #4CAF50;
  font-weight: bold;
}

.item-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.item-btn {
  flex: 1;
  min-width: 100px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.item-btn.equip {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
}

.item-btn.use {
  background: linear-gradient(135deg, #2196F3, #1976D2);
}

.item-btn.drop {
  background: linear-gradient(135deg, #F44336, #D32F2F);
}

.item-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* ==========================================
   GAME OVER SCREEN
   ========================================== */
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.game-over-screen {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 3px solid #F44336;
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  color: white;
  text-align: center;
  animation: game-over-appear 0.5s ease;
}

@keyframes game-over-appear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.game-over-title {
  font-size: 48px;
  color: #F44336;
  margin-bottom: 30px;
  text-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
}

.game-over-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.stat {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #333;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat span:first-child {
  color: #ccc;
  font-size: 14px;
}

.stat .value {
  color: #4CAF50;
  font-size: 24px;
  font-weight: bold;
}

.game-over-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.game-over-btn {
  flex: 1;
  max-width: 200px;
  padding: 15px;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.game-over-btn.retry {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
}

.game-over-btn.menu {
  background: linear-gradient(135deg, #2196F3, #1976D2);
}

.game-over-btn.share {
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
}

.game-over-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* ==========================================
   LEVEL COMPLETE
   ========================================== */
.level-complete-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-complete-screen {
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid #4CAF50;
  border-radius: 20px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  color: white;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.level-complete-title {
  font-size: 32px;
  color: #4CAF50;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.level-complete-stats {
  margin-bottom: 30px;
}

.level-complete-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.level-complete-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.level-complete-btn.next {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
}

.level-complete-btn.menu {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.level-complete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* ==========================================
   TUTORIAL
   ========================================== */
.tutorial-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.tutorial-content {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 3px solid #2196F3;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  color: white;
}

.tutorial-content h2 {
  color: #2196F3;
  text-align: center;
  margin-bottom: 20px;
  font-size: 28px;
}

.tutorial-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.tutorial-section h3 {
  color: #4CAF50;
  margin-bottom: 10px;
  font-size: 20px;
}

.tutorial-section p {
  color: #ccc;
  margin-bottom: 5px;
  line-height: 1.5;
}

.tutorial-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.tutorial-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

/* ==========================================
   NOTIFICATIONS
   ========================================== */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.notification {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border-left: 4px solid;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 10px;
  color: white;
  display: flex;
  align-items: center;
  gap: 15px;
  max-width: 300px;
  animation: notification-slide 0.3s ease;
  z-index: 1000;
  cursor: pointer;
}

@keyframes notification-slide {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.info {
  border-left-color: #2196F3;
}

.notification.success {
  border-left-color: #4CAF50;
}

.notification.error {
  border-left-color: #F44336;
}

.notification.damage {
  border-left-color: #FF9800;
}

.notification.heal {
  border-left-color: #00BCD4;
}

.notification.item {
  border-left-color: #9C27B0;
}

.notification.level {
  border-left-color: #FFD700;
}

.notification.combat {
  border-left-color: #795548;
}

.notification.save {
  border-left-color: #607D8B;
}

.notification-icon {
  font-size: 20px;
}

.notification-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

/* ==========================================
   LOADING SCREEN
   ========================================== */
.loading-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  border: 8px solid rgba(76, 175, 80, 0.3);
  border-top: 8px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: white;
  font-size: 24px;
  text-align: center;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-progress {
  width: 300px;
  max-width: 80%;
}

.loading-progress .progress-bar {
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
}

.loading-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 10px;
  transition: width 0.3s ease;
}

/* ==========================================
   AUDIO CONTROLS
   ========================================== */
.audio-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}

.audio-btn {
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #555;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.audio-btn:hover {
  border-color: #4CAF50;
  transform: scale(1.1);
}

.audio-btn.muted {
  opacity: 0.5;
}

/* ==========================================
   RESPONSIVE DESIGN
   ========================================== */
@media (max-width: 768px) {
  .minimap {
    width: 150px;
    height: 150px;
    top: 10px;
    right: 10px;
  }
  
  .game-hud {
    top: 10px;
    left: 10px;
  }
  
  .quick-inventory {
    bottom: 10px;
    gap: 5px;
  }
  
  .quick-slot {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .joystick-container {
    bottom: 80px;
    left: 20px;
  }
  
  .joystick-base {
    width: 80px;
    height: 80px;
  }
  
  .joystick-thumb {
    width: 40px;
    height: 40px;
    top: 20px;
    left: 20px;
  }
  
  .mobile-actions {
    bottom: 20px;
    right: 20px;
    gap: 10px;
  }
  
  .mobile-btn {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
  
  .inventory-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .game-over-stats {
    grid-template-columns: 1fr;
  }
  
  .game-over-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .game-over-btn {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .minimap {
    width: 120px;
    height: 120px;
  }
  
  .health-bar, .stamina-bar, .xp-bar {
    width: 150px;
  }
  
  .quick-slot {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .mobile-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .inventory-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .dialog-box {
    padding: 15px;
  }
  
  .dialog-character {
    font-size: 20px;
  }
  
  .dialog-text {
    font-size: 16px;
  }
}

/* ==========================================
   RESPONSIVE DESIGN
   ========================================== */
@media (max-width: 768px) {
  .main-menu {
    padding: 20px;
  }
  
  .menu-btn {
    font-size: 16px;
    padding: 12px 20px;
  }
  
  .diff-btn {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>