<template>
    <header class="header">
        <!-- Левая часть -->
        <div class="header-left">
            <router-link to="/" class="logo-icon">
                <img src="../assets/logo.svg" alt="Логотип">
            </router-link>

            <!-- Десктопная навигация (скрывается на мобильных) -->
            <nav class="nav desktop-nav">
                <button class="nav-link active" @click="openGameModal">ИГРА</button>
                <a href="/puzzles" class="nav-link">ЗАДАЧИ</a>
                <a href="/openings" class="nav-link">ДЕБЮТЫ</a>
                <a href="/analysis" class="nav-link">АНАЛИЗ</a>
                <a href="/support" class="nav-link support">ПОДДЕРЖАТЬ ПРОЕКТ</a>
            </nav>
        </div>

        <!-- Правая часть -->
        <div class="header-right" ref="menuRef">
            <!-- Бургер-кнопка (видна только на мобильных) -->
            <button class="burger-button" @click="toggleMobileMenu" :class="{ 'is-active': isMobileMenuOpen }">
                <span></span>
                <span></span>
                <span></span>
            </button>

            <div class="auth-zone">
                <!-- если НЕ залогинен -->
                <a v-if="!authStore.isAuthenticated || authStore.isGuest" href="/login" class="nav-link login-link">
                    ВХОД
                </a>

                <!-- если залогинен -->
                <div v-else class="user-wrapper" @click="toggleMenu">
                    <div class="username">
                        <span class="name-text">{{ authStore.user?.Username }}</span>
                        <span class="arrow" :class="{ 'arrow-rotate': menuOpen }">▾</span>
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
        </div>

        <!-- Мобильное меню (выезжающее) -->
        <div class="mobile-menu" :class="{ 'is-open': isMobileMenuOpen }">
            <nav class="mobile-nav">
                <button class="nav-link" @click="handleMobileAction(openGameModal)">ИГРА</button>
                <a href="/puzzles" class="nav-link">ЗАДАЧИ</a>
                <a href="/openings" class="nav-link">ДЕБЮТЫ</a>
                <a href="/analysis" class="nav-link">АНАЛИЗ</a>
                <a href="/support" class="nav-link support">ПОДДЕРЖАТЬ ПРОЕКТ</a>
            </nav>
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
const isMobileMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
    menuOpen.value = !menuOpen.value
}

function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    if (isMobileMenuOpen.value) menuOpen.value = false
}

function openGameModal() {
    showModal.value = true
}

function handleMobileAction(callback: Function) {
    isMobileMenuOpen.value = false
    callback()
}

async function logout() {
    await authStore.logout()
    menuOpen.value = false
    isMobileMenuOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
    if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
        menuOpen.value = false
    }
    // Закрывать мобильное меню при клике по фону, если нужно (опционально)
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
    z-index: 1001; /* Выше мобильного меню */
}

/* Левая часть */
.header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo-icon {
    display: flex;
    align-items: center;
    margin-right: 1rem;
    z-index: 1002;
}

.logo-icon img {
    width: 2.5rem;
    height: 2.5rem;
}

/* Навигация */
.nav {
    display: flex;
    gap: 18px;
}

.nav-link {
    color: #D9D9D9;
    text-decoration: none;
    font-family: 'Alumni Sans', sans-serif; /* Явно указываем шрифт */
    font-weight: 600;
    font-size: 2rem;
    line-height: 100%;
    transition: color 0.2s;
    
    /* Сброс для button */
    background: none;
    border: none;
    padding: 0; 
    margin: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
}

.nav-link:hover, .nav-link.active {
    color: white;
}

.nav-link.support {
    color: #9351B1;
}

/* Правая часть */
.header-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.username {
    color: #D9D9D9;
    font-weight: 600;
    font-size: 2rem;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}

.arrow {
    font-size: 1.5rem;
    transition: transform 0.3s;
}

.arrow-rotate {
    transform: rotate(180deg);
}

/* Бургер кнопка */
.burger-button {
    display: none;
    flex-direction: column;
    justify-content: space-around;
    width: 30px;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 1002;
}

.burger-button span {
    width: 30px;
    height: 3px;
    background: #D9D9D9;
    border-radius: 10px;
    transition: all 0.3s linear;
}

/* Выпадающее меню (Десктоп) */
.dropdown {
    position: absolute;
    top: 100%;
    right: 16px;
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
    font-size: 1.5rem;
    font-weight: 500;
    display: block;
    border-bottom: 1px solid #3a2a43;
    cursor: pointer;
}

.dropdown-item:hover {
    background-color: #3a2a43;
    color: white;
}

.logout { color: #ff6b6b; }

/* Мобильное меню */
.mobile-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: #190B21;
    display: flex;
    flex-direction: column;
    padding-top: 5rem;
    padding-left: 2rem;
    transform: translateX(-100%);
    transition: transform 0.4s ease-in-out;
    z-index: 1000;
}

.mobile-menu.is-open {
    transform: translateX(0);
}

.mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Адаптивность */
@media (max-width: 1100px) {
    .nav-link { font-size: 1.6rem; }
    .header-left { padding-left: 0; }
}

@media (max-width: 720px) {
    .desktop-nav {
        display: none;
    }
    
    .burger-button {
        display: flex;
        order: 2;
    }

    /* Анимация бургера в крестик */
    .burger-button.is-active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .burger-button.is-active span:nth-child(2) { opacity: 0; }
    .burger-button.is-active span:nth-child(3) { transform: rotate(-45deg) translate(7px, -7px); }

    .auth-zone {
        order: 1;
    }

    .username, .login-link {
        font-size: 1.6rem;
    }

    .name-text {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

@media (max-width: 480px) {
    .header {
        padding: 0 12px;
    }
    .logo-icon img {
        width: 2.2rem;
        height: 2.2rem;
    }
    .name-text {
        max-width: 80px;
    }
}
</style>