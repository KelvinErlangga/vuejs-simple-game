<template>
  <div class="game-container" :class="{ 'mobile-view': isMobile, 'portrait-rotate': isMobile && isPortrait }">
    <!-- Canvas untuk Game -->
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    
    <!-- Minimap Component -->
    <Minimap 
      :isMobile="isMobile"
      :showMinimap="showMinimap"
      :minimapTiles="minimapTiles"
      :isTileVisible="isTileVisible"
    />

    <!-- Desktop HUD Component -->
    <DesktopHud 
      :isMobile="isMobile"
      :player="player"
      :activeStatusEffects="activeStatusEffects"
    />

    <!-- Mobile HUD Component -->
    <MobileHud 
      :isMobile="isMobile"
      :player="player"
      :quickSlots="quickSlots"
      :selectedQuickSlot="selectedQuickSlot"
      :activeStatusEffects="activeStatusEffects"
      @selectQuickSlot="selectQuickSlot"
    />

    <!-- Desktop Controls Component -->
    <DesktopControls 
      :isMobile="isMobile"
      :keys="keys"
      @keyDown="keyDown"
      @keyUp="keyUp"
      @performAction="performAction"
      @startBlocking="startBlocking"
      @stopBlocking="stopBlocking"
      @useSelectedItem="useSelectedItem"
    />

    <!-- Mobile Controls Component -->
    <MobileControls 
      :isMobile="isMobile"
      :joystickPosition="joystickPosition"
      @startJoystick="startJoystick"
      @updateJoystick="updateJoystick"
      @endJoystick="endJoystick"
      @performAction="performAction"
      @startBlocking="startBlocking"
      @stopBlocking="stopBlocking"
      @useSelectedItem="useSelectedItem"
      @toggleMobileMenu="toggleMobileMenu"
    />

    <!-- Quick Inventory Component -->
    <QuickInventory 
      :isMobile="isMobile"
      :quickSlots="quickSlots"
      :selectedQuickSlot="selectedQuickSlot"
      @selectQuickSlot="selectQuickSlot"
      @clearQuickSlot="clearQuickSlot"
    />

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
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameState } from './composables/useGameState.js'
import { useGameLogic } from './composables/useGameLogic.js'

// Import components
import MobileHud from './components/MobileHud.vue'
import MobileControls from './components/MobileControls.vue'
import DesktopHud from './components/DesktopHud.vue'
import DesktopControls from './components/DesktopControls.vue'
import Minimap from './components/Minimap.vue'
import QuickInventory from './components/QuickInventory.vue'

export default {
  name: 'DungeonMazeGame',
  
  components: {
    MobileHud,
    MobileControls,
    DesktopHud,
    DesktopControls,
    Minimap,
    QuickInventory
  },
  
  setup() {
    // Use composables
    const gameState = useGameState()
    const gameLogic = useGameLogic(gameState)
    
    // Destructure needed values from gameState
    const {
      gameCanvas, joystickBase, isMobile, isPortrait, loading, loadingProgress,
      gameOver, gameOverReason, showMainMenu, showInventory, showMobileMenu,
      showMinimap, showTutorial, showLevelComplete, gamePaused, gameTime,
      currentFloor, enemiesDefeated, itemsCollected, player, keys,
      joystickPosition, joystickActive, joystickTouchId, selectedQuickSlot,
      enemies, items, walls, floors, exits, projectiles, particles,
      notifications, activeStatusEffects, activeDialog, dialogText, dialogIndex,
      gameDifficulty, musicVolume, sfxVolume, musicEnabled, sfxEnabled,
      difficulties, statistics, quickSlots, minimapTiles,
      selectedInventoryItem, hasSaveData, currentDifficulty,
      addNotification, removeNotification, formatTime, isTileVisible,
      detectMobile, handleResize
    } = gameState
    
    // Destructure needed methods from gameLogic
    const {
      generateMaze, spawnPlayer, spawnEnemies, spawnItems, spawnExit,
      checkWallCollision, getWallCollisionResponse, updateMinimap,
      applyDifficultyToEnemies
    } = gameLogic
    
    // Additional refs for UI
    const showLoadMenu = ref(false)
    const showSettings = ref(false)
    const selectedInventorySlot = ref(-1)
    
    // ==========================================
    // GAME METHODS
    // ==========================================
    const initGame = () => {
      showMainMenu.value = false
      loading.value = true
      loadingProgress.value = 0
      
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
      
      setTimeout(() => {
        try {
          const config = levelConfigs[Math.min(currentFloor.value - 1, levelConfigs.length - 1)]
          
          generateMaze()
          spawnPlayer()
          spawnEnemies(config.enemyCount)
          spawnItems(config.itemCount)
          spawnExit()
          
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
    
    const retryGame = () => {
      gameOver.value = false
      startNewGame()
    }
    
    const quitToMenu = () => {
      showMainMenu.value = true
      gameOver.value = false
      showLevelComplete.value = false
    }
    
    const exitGame = () => {
      saveGame()
      addNotification('Game saved. Thanks for playing!', 'info')
    }
    
    // ==========================================
    // INPUT HANDLERS
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
      const maxDistance = 40
      
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
    // GAME ACTIONS
    // ==========================================
    const performAction = (action) => {
      switch(action) {
        case 'attack':
          // Attack logic here
          playSFX('attack')
          break
        case 'dash':
          // Dash logic here
          playSFX('dash')
          break
      }
    }
    
    const startBlocking = () => {
      player.isBlocking = true
    }
    
    const stopBlocking = () => {
      player.isBlocking = false
    }
    
    const useSelectedItem = () => {
      if (selectedInventoryItem.value) {
        useItem(selectedInventoryItem.value)
      }
    }
    
    // ==========================================
    // INVENTORY MANAGEMENT
    // ==========================================
    const selectQuickSlot = (index) => {
      selectedQuickSlot.value = index
    }
    
    const clearQuickSlot = (index) => {
      quickSlots.value[index].item = null
    }
    
    const selectInventorySlot = (index) => {
      selectedInventorySlot.value = index
    }
    
    const toggleInventory = () => {
      showInventory.value = !showInventory.value
    }
    
    // ==========================================
    // UI HELPERS
    // ==========================================
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
    
    // ==========================================
    // AUDIO SYSTEM
    // ==========================================
    const playSFX = (type) => {
      if (!sfxEnabled.value) return
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
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
          window.gameMusicOscillator = oscillator
          window.gameMusicGainNode = gainNode
          window.gameMusicContext = audioContext
        } catch (error) {
          console.log('Music started (simulated)')
        }
      } else {
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
    
    // ==========================================
    // SAVE/LOAD SYSTEM
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
          
          if (!data.player || !data.game) {
            throw new Error('Invalid save data format')
          }
          
          Object.assign(player, data.player)
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
          
          if (data.statistics) {
            Object.assign(statistics, data.statistics)
          }
          
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
    // LIFECYCLE
    // ==========================================
    onMounted(() => {
      // Set up canvas
      if (gameCanvas.value) {
        gameCanvas.value.width = window.innerWidth
        gameCanvas.value.height = window.innerHeight
      }
      
      // Set up keyboard controls
      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase()
        if (['w', 'a', 's', 'd'].includes(key)) {
          e.preventDefault()
          keys[key] = true
        }
        
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
      window.addEventListener('resize', handleResize)
      
      // Prevent context menu on game canvas
      const canvas = gameCanvas.value
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
    
    return {
      // State
      gameCanvas,
      joystickBase,
      isMobile,
      isPortrait,
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
      gamePaused,
      gameTime,
      currentFloor,
      enemiesDefeated,
      itemsCollected,
      player,
      keys,
      joystickPosition,
      selectedQuickSlot,
      enemies,
      items,
      walls,
      floors,
      exits,
      projectiles,
      particles,
      notifications,
      activeStatusEffects,
      activeDialog,
      dialogText,
      dialogIndex,
      gameDifficulty,
      musicVolume,
      sfxVolume,
      musicEnabled,
      sfxEnabled,
      difficulties,
      statistics,
      quickSlots,
      minimapTiles,
      selectedInventoryItem,
      hasSaveData,
      currentDifficulty,
      showLoadMenu,
      showSettings,
      selectedInventorySlot,
      
      // Methods
      startNewGame,
      continueGame,
      retryGame,
      quitToMenu,
      exitGame,
      keyDown,
      keyUp,
      startJoystick,
      updateJoystick,
      endJoystick,
      performAction,
      startBlocking,
      stopBlocking,
      useSelectedItem,
      selectQuickSlot,
      clearQuickSlot,
      selectInventorySlot,
      toggleInventory,
      toggleMobileMenu,
      hideTutorial,
      setDifficulty,
      toggleMusic,
      toggleSFX,
      saveGame,
      loadGame,
      formatTime,
      isTileVisible,
      addNotification,
      removeNotification
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
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #000;
  color: white;
  overflow: hidden;
}

.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #0f0f1e);
  overflow: hidden;
}

.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
}

.mobile-view .game-canvas {
  touch-action: none;
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

/* ==========================================
   PORTRAIT ORIENTATION HANDLING
   ========================================== */
.portrait-rotate {
  transform: rotate(90deg);
  transform-origin: center;
  width: 100vh !important;
  height: 100vw !important;
}

.portrait-rotate .game-canvas {
  transform: translate(-50%, -50%) rotate(90deg) !important;
}

/* ==========================================
   ANIMATIONS
   ========================================== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* ==========================================
   TRANSITIONS
   ========================================== */
.notification-enter-active {
  animation: slideIn 0.3s ease-out;
}

.notification-leave-active {
  animation: fadeIn 0.3s ease-out reverse;
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
