<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  type: 'text',
  placeholder: '',
  error: '',
  disabled: false,
  required: false,
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="w-full text-left">
    <label v-if="label" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative rounded-lg shadow-sm">
      <div v-if="$slots.icon" class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <slot name="icon" />
      </div>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2',
          $slots.icon ? 'pl-10' : 'pl-3.5',
          error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-200 text-slate-900 focus:border-brand-orange focus:ring-orange-100',
          disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-500 font-medium">
      {{ error }}
    </p>
  </div>
</template>
