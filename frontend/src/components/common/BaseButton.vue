<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
});

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      // Size variants
      size === 'sm' && 'px-3 py-1.5 text-xs',
      size === 'md' && 'px-5 py-2.5 text-sm',
      size === 'lg' && 'px-7 py-3.5 text-base shadow-md',
      // Style variants (Figma Brand Orange)
      variant === 'primary' && 'bg-brand-orange text-white hover:bg-brand-orange-hover focus:ring-brand-orange shadow-sm active:scale-95',
      variant === 'secondary' && 'bg-brand-blue text-white hover:bg-brand-blue-dark focus:ring-brand-blue active:scale-95',
      variant === 'outline' && 'border-2 border-brand-orange text-brand-orange hover:bg-orange-50 focus:ring-brand-orange',
      variant === 'ghost' && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      // Disabled state
      (disabled || loading) && 'opacity-50 cursor-not-allowed active:scale-100 shadow-none',
    ]"
    @click="$emit('click', $event)"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>
