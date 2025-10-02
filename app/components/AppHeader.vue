<template>
  <header class="bg-white shadow">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
      <NuxtLink to="/dashboard" class="text-xl font-semibold text-primary">DocHub DMS</NuxtLink>
      <nav class="flex items-center gap-4">
        <NuxtLink
          to="/upload"
          class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary-dark"
        >
          Upload
        </NuxtLink>
        <NuxtLink to="/dashboard" class="text-sm font-medium text-slate-700 hover:text-primary-dark">
          Dashboard
        </NuxtLink>
        <button v-if="isAuthenticated" class="text-sm text-slate-600 hover:text-red-500" @click="logout">Sign out</button>
        <NuxtLink v-else to="/login" class="text-sm text-slate-600 hover:text-primary-dark">Login</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const { isAuthenticated, logout } = useAuth()
</script>
