<script setup>
import UserListItem from "../UserListItem.vue";

defineProps({
  users: { type: Array, required: true },
  onSelect: { type: Function, required: true },
});
</script>

<template>
  <ul class="divide-y divide-gray-50">
    <li v-for="user in users" :key="user._id">
      <UserListItem :user="user" @click="onSelect" />
    </li>
  </ul>
</template>
