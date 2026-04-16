<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences, updatePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { useFullscreen } from '@vueuse/core';

import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isFullscreen, enter, exit, toggle } = useFullscreen();
const prevLayout = ref<null | typeof preferences.app.layout>(null);

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

async function handleFullscreen() {
  try {
    await (isFullscreen.value ? exit() : enter());
  } catch {
    await toggle();
  }
}

watch(isFullscreen, (val) => {
  if (val) {
    if (preferences.app.layout !== 'full-content') {
      prevLayout.value = preferences.app.layout;
    }
    updatePreferences({
      app: {
        layout: 'full-content',
        enablePreferences: false,
      },
    });
    return;
  }

  if (prevLayout.value) {
    updatePreferences({
      app: {
        layout: prevLayout.value,
        enablePreferences: true,
      },
    });
    prevLayout.value = null;
  }
});

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        trigger="both"
        @logout="handleLogout"
      />
    </template>
    <template #fullscreen>
      <button
        class="mr-1 inline-flex items-center justify-center"
        type="button"
        @click="handleFullscreen"
      >
        <IconifyIcon
          :icon="isFullscreen ? 'lucide:minimize' : 'lucide:maximize'"
          class="size-4 text-foreground"
        />
      </button>
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
