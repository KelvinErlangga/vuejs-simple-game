import { ref } from 'vue'

export function useGameLogic(gameState) {
  const {
    player, enemies, items, walls, floors, exits, projectiles, particles,
    gameTime, currentFloor, enemiesDefeated, itemsCollected,
    mazeWidth, mazeHeight, tileSize, minimapTiles,
    levelConfigs, gameDifficulty, difficulties,
    isMobile, joystickPosition, keys,
    addNotification
  } = gameState
  
  // ==========================================
  // 1. MAZE GENERATION
  // ==========================================
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
  
  // ==========================================
  // 2. SPAWNING SYSTEM
  // ==========================================
  const spawnPlayer = () => {
    let safeX, safeY
    let attempts = 0
    
    do {
      safeX = Math.floor(Math.random() * (mazeWidth - 4)) + 2
      safeY = Math.floor(Math.random() * (mazeHeight - 4)) + 2
      attempts++
      
      const testX = safeX * tileSize + tileSize / 2
      const testY = safeY * tileSize + tileSize / 2
      
      const margin = 5
      if (
        !checkWallCollision(testX - margin, testY - margin, player.width + margin * 2, player.height + margin * 2) &&
        !checkWallCollision(testX, testY, player.width, player.height)
      ) {
        break
      }
    } while (attempts < 200)
    
    if (attempts >= 200) {
      safeX = Math.floor(mazeWidth / 2)
      safeY = Math.floor(mazeHeight / 2)
      console.warn('Could not find safe spawn position, using center')
    }
    
    player.x = safeX * tileSize + tileSize / 2
    player.y = safeY * tileSize + tileSize / 2
    
    // Final safety check
    if (checkWallCollision(player.x, player.y)) {
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
    
    // Apply difficulty to enemies
    applyDifficultyToEnemies()
  }
  
  const spawnItems = (count) => {
    items.value = []
    
    const itemTypes = [
      {
        name: 'Health Potion',
        type: 'potion',
        color: '#FF5252',
        icon: '🧪',
        healing: 30,
        quantity: 1,
        description: 'Restores 30 HP'
      },
      {
        name: 'Stamina Potion',
        type: 'potion',
        color: '#2196F3',
        icon: '🍺',
        healing: 50,
        quantity: 1,
        description: 'Restores 50 stamina'
      },
      {
        name: 'Speed Boost',
        type: 'consumable',
        color: '#FF9800',
        icon: '⚡',
        effect: 'speed',
        duration: 10,
        description: 'Increases speed for 10s'
      },
      {
        name: 'Shield',
        type: 'armor',
        color: '#9C27B0',
        icon: '🛡️',
        defense: 5,
        description: 'Adds 5 defense'
      },
      {
        name: 'Magic Sword',
        type: 'weapon',
        color: '#E91E63',
        icon: '⚔️',
        damage: 15,
        description: 'Deals 15 damage'
      }
    ]
    
    for (let i = 0; i < count; i++) {
      let safeX, safeY
      let attempts = 0
      
      do {
        safeX = Math.floor(Math.random() * (mazeWidth - 2)) + 1
        safeY = Math.floor(Math.random() * (mazeHeight - 2)) + 1
        attempts++
      } while (
        walls.value.some(wall => 
          Math.floor(wall.x / tileSize) === safeX && Math.floor(wall.y / tileSize) === safeY
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
        color: type.color,
        name: type.name,
        type: type.type,
        icon: type.icon,
        healing: type.healing,
        damage: type.damage,
        defense: type.defense,
        effect: type.effect,
        duration: type.duration,
        quantity: type.quantity || 1,
        description: type.description,
        collected: false
      })
    }
  }
  
  const spawnExit = () => {
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
      distance < 10 &&
      attempts < 100
    )
    
    exits.value.push({
      x: safeX * tileSize + tileSize / 2,
      y: safeY * tileSize + tileSize / 2,
      width: tileSize,
      height: tileSize,
      color: '#00BCD4',
      icon: '🚪'
    })
  }
  
  // ==========================================
  // 3. COLLISION DETECTION
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
  
  const getWallCollisionResponse = (newX, newY, width = player.width, height = player.height) => {
    const halfWidth = width / 2
    const halfHeight = height / 2
    let collisionX = false
    let collisionY = false
    let slideX = newX
    let slideY = newY
    
    for (const wall of walls.value) {
      if (
        newX + halfWidth > wall.x &&
        newX - halfWidth < wall.x + wall.width &&
        newY + halfHeight > wall.y &&
        newY - halfHeight < wall.y + wall.height
      ) {
        const overlapLeft = (newX + halfWidth) - wall.x
        const overlapRight = (wall.x + wall.width) - (newX - halfWidth)
        const overlapTop = (newY + halfHeight) - wall.y
        const overlapBottom = (wall.y + wall.height) - (newY - halfHeight)
        
        const minOverlapX = Math.min(overlapLeft, overlapRight)
        const minOverlapY = Math.min(overlapTop, overlapBottom)
        
        if (minOverlapX < minOverlapY) {
          if (overlapLeft < overlapRight) {
            slideX = wall.x - halfWidth - 1
          } else {
            slideX = wall.x + wall.width + halfWidth + 1
          }
          collisionX = true
        } else {
          if (overlapTop < overlapBottom) {
            slideY = wall.y - halfHeight - 1
          } else {
            slideY = wall.y + wall.height + halfHeight + 1
          }
          collisionY = true
        }
      }
    }
    
    return { collisionX, collisionY, slideX, slideY }
  }
  
  // ==========================================
  // 4. MINIMAP
  // ==========================================
  const updateMinimap = () => {
    minimapTiles.value = []
    
    for (let y = 0; y < mazeHeight; y++) {
      const row = []
      for (let x = 0; x < mazeWidth; x++) {
        const isWall = walls.value.some(wall => 
          Math.floor(wall.x / tileSize) === x && Math.floor(wall.y / tileSize) === y
        )
        
        const isPlayer = Math.floor(player.x / tileSize) === x && Math.floor(player.y / tileSize) === y
        
        const isEnemy = enemies.value.some(enemy => 
          Math.floor(enemy.x / tileSize) === x && Math.floor(enemy.y / tileSize) === y
        )
        
        const isItem = items.value.some(item => 
          Math.floor(item.x / tileSize) === x && Math.floor(item.y / tileSize) === y
        )
        
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
  
  // ==========================================
  // 5. DIFFICULTY SYSTEM
  // ==========================================
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
  
  return {
    // Maze generation
    generateMaze,
    createSimpleMaze,
    createPath,
    
    // Spawning
    spawnPlayer,
    spawnEnemies,
    spawnItems,
    spawnExit,
    
    // Collision
    checkWallCollision,
    getWallCollisionResponse,
    
    // Minimap
    updateMinimap,
    
    // Difficulty
    applyDifficultyToEnemies
  }
}
