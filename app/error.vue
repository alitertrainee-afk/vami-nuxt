<script setup>
const props = defineProps({
  error: Object,
});

const handleError = () => clearError({ redirect: "/" });
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center max-w-md">
      <!-- Error Code -->
      <h1 class="text-8xl font-extrabold text-indigo-600 tracking-tight">
        {{ error?.statusCode || 500 }}
      </h1>

      <!-- Error Title -->
      <h2 class="mt-4 text-2xl font-bold text-gray-900">
        {{
          error?.statusCode === 404 ? "Page not found" : "Something went wrong"
        }}
      </h2>

      <!-- Error Message -->
      <p class="mt-3 text-base text-gray-500 leading-relaxed">
        {{
          error?.message || "An unexpected error occurred. Please try again."
        }}
      </p>

      <!-- Actions -->
      <div
        class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <button
          @click="handleError"
          class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Go to Homepage
        </button>
        <button
          @click="clearError()"
          class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>
