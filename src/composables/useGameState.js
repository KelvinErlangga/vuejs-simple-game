import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'

export function useGameState() {
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
  // 3. UTILITY FUNCTIONS
  // ==========================================
  const addNotification = (text, type) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      damage: '💥',
      save: '💾',
      pickup: '📦',
      levelup: '⬆️'
    }
    
    notifications.value.push({
      id: notificationId.value++,
      text,
      type,
      icon: icons[type] || 'ℹ️',
      timestamp: Date.now()
    })
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notificationId.value - 1)
    }, 5000)
  }
  
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const isTileVisible = (x, y) => {
    const playerTileX = Math.floor(player.x / tileSize)
    const playerTileY = Math.floor(player.y / tileSize)
    const distance = Math.sqrt(Math.pow(playerTileX - x, 2) + Math.pow(playerTileY - y, 2))
    return distance < 8
  }
  
  // ==========================================
  // 4. DEVICE DETECTION
  // ==========================================
  const detectMobile = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    isMobile.value = mobileRegex.test(userAgent) || window.innerWidth < 768
    
    // Detect portrait orientation
    isPortrait.value = window.innerHeight > window.innerWidth
  }
  
  const handleResize = () => {
    detectMobile()
    if (gameCanvas.value) {
      gameCanvas.value.width = window.innerWidth
      gameCanvas.value.height = window.innerHeight
    }
  }
  
  // ==========================================
  // 5. LIFECYCLE
  // ==========================================
  onMounted(() => {
    detectMobile()
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
    
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
    joystickActive,
    joystickTouchId,
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
    levelConfigs,
    mazeWidth,
    mazeHeight,
    tileSize,
    
    // Computed
    selectedInventoryItem,
    hasSaveData,
    currentDifficulty,
    
    // Methods
    addNotification,
    removeNotification,
    formatTime,
    isTileVisible,
    detectMobile,
    handleResize
  }
}
