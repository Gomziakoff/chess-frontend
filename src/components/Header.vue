<template>
    <header class="header">
        <!-- Левая часть -->
        <div class="header-left">
            <router-link to="/" class="logo-icon">
                <img src="../assets/logo.svg" alt="Логотип">
            </router-link>

            <nav class="nav">
                <button class="nav-link active" @click="openGameModal">
                    ИГРА
                </button>
                <a href="/puzzles" class="nav-link">ЗАДАЧИ</a>
                <a href="/openings" class="nav-link">ДЕБЮТЫ</a>

                <a href="/analysis" class="nav-link">АНАЛИЗ</a>
                <a href="#" class="nav-link support">ПОДДЕРЖАТЬ ПРОЕКТ</a>
            </nav>
        </div>

        <!-- Правая часть -->
        <div class="header-right" ref="menuRef">
            <!-- если НЕ залогинен -->
            <a v-if="!authStore.isAuthenticated" href="/login" class="nav-link">
                ВХОД
            </a>

            <!-- если залогинен -->
            <div v-else class="user-wrapper" @click="toggleMenu">
                <div class="username">
                    {{ authStore.user?.Username }}
                    <span class="arrow">▾</span>
                </div>

                <div v-if="menuOpen" class="dropdown">
                    <a href="/profile" class="dropdown-item">Профиль</a>
                    <a href="/settings" class="dropdown-item">Настройки</a>
                    <div class="dropdown-item logout" @click.stop="logout">
                        Выход
                    </div>
                </div>
            </div>
        </div>
    </header>
    <start-game-modal v-if="showModal" @close="showModal = false" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import StartGameModal from './StartGameModal.vue'
import { useAuthStore } from '../stores/auth'


const authStore = useAuthStore()

const showModal = ref(false)
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
    menuOpen.value = !menuOpen.value
}

function openGameModal() {
    showModal.value = true
}

async function logout() {
    await authStore.logout()
    menuOpen.value = false
}

// закрытие при клике вне
function handleClickOutside(e: MouseEvent) {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        menuOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    authStore.fetchMe()
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Alumni+Sans:wght@400;500;600;700&display=swap');

.header {
    height: 3.75rem;
    background: #190B21;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-family: 'Alumni Sans', system-ui, Avenir, Helvetica, Arial, sans-serif;
    position: relative;
    /* Добавлено для контекста позиционирования */
}

/* Левая часть */
.header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-left: 2rem;
}

.logo-icon {
    width: 1rem;
    height: 1rem;
    background: #2a2a2a;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    margin-right: 2rem;
}

.logo-icon img {
    width: 2.8rem;
    height: 2.8rem;
}

/* Навигация */
button.nav-link {
    background: none;
    border: none;
    cursor: pointer;
}


.nav {
    display: flex;
    gap: 18px;
}

.nav-link {
    color: #D9D9D9;
    text-decoration: none;
    font-family: Alumni Sans;
    font-weight: 600;
    font-style: SemiBold;
    font-size: 2rem;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: right;
}

.nav-link:hover {
    color: white;
}

.nav-link.active {
    color: white;
}

.nav-link.support {
    color: #9351B1;
}

/* Правая часть - новый стиль */
.header-right {
    position: relative;
    /* Важно для позиционирования дропдауна */
    padding-right: 2rem;
}

/* Стили для пользовательского меню */
.user-wrapper {
    position: relative;
    cursor: pointer;
}

.username {
    color: #D9D9D9;
    font-family: Alumni Sans;
    font-weight: 600;
    font-size: 2rem;
    display: flex;
    align-items: center;
    gap: 4px;
}

.username:hover {
    color: white;
}

.arrow {
    font-size: 1.5rem;
    transition: transform 0.2s;
}

/* Стили для выпадающего меню */
.dropdown {
    position: absolute;
    top: 100%;
    /* Располагается сразу под username */
    right: 0;
    /* Выравнивание по правому краю */
    margin-top: 8px;
    background: #2a1a33;
    border: 1px solid #3a2a43;
    border-radius: 8px;
    min-width: 180px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    overflow: hidden;
}

.dropdown-item {
    padding: 12px 20px;
    color: #D9D9D9;
    text-decoration: none;
    font-family: Alumni Sans;
    font-size: 1.5rem;
    font-weight: 500;
    display: block;
    transition: background-color 0.2s;
    border-bottom: 1px solid #3a2a43;
}

.dropdown-item:last-child {
    border-bottom: none;
}

.dropdown-item:hover {
    background-color: #3a2a43;
    color: white;
}

.logout {
    color: #ff6b6b;
}

.logout:hover {
    background-color: #3a2a43;
    color: #ff6b6b;
}
</style>