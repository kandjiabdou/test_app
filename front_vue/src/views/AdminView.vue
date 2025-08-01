<template>
  <v-container fluid>
    <AdminUsersSection />
    <v-divider class="my-4" />
    <AdminApplicationsSection />
  </v-container>
</template>
<script>
import AdminApplicationsSection from '@/components/AdminApplicationsSection.vue';
import AdminUsersSection from '@/components/AdminUsersSection.vue';

export default {
  components: {
    AdminApplicationsSection,
    AdminUsersSection
  } 
};
</script>