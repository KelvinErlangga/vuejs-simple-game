<template>
  <!-- Inventory Quick Access Desktop -->
  <div class="quick-inventory" v-if="!isMobile">
    <div 
      v-for="(slot, index) in quickSlots" 
      :key="index"
      class="quick-slot"
      :class="{ active: selectedQuickSlot === index, empty: !slot.item }"
      @click="$emit('selectQuickSlot', index)"
      @contextmenu.prevent="$emit('clearQuickSlot', index)"
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
</template>

<script>
export default {
  name: 'QuickInventory',
  props: {
    isMobile: Boolean,
    quickSlots: Array,
    selectedQuickSlot: Number
  },
  emits: ['selectQuickSlot', 'clearQuickSlot']
}
</script>

<style scoped>
/* ==========================================
   QUICK INVENTORY
   ========================================== */
.quick-inventory {
  position: absolute;
  top: 20px;
  right: 240px;
  display: flex;
  gap: 8px;
  z-index: 95;
}

.quick-slot {
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.quick-slot:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.5);
}

.quick-slot.active {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.3);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.quick-slot.empty {
  opacity: 0.7;
}

.slot-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.slot-icon {
  font-size: 24px;
}

.slot-quantity {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #FF9800;
  color: white;
  font-size: 10px;
  padding: 1px 3px;
  border-radius: 50%;
  min-width: 16px;
  text-align: center;
  font-weight: bold;
}

.slot-empty {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: bold;
}
</style>
