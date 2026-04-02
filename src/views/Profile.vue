<template>
  <div class="profile-container" v-if="auth.user">
    <!-- ВЕРХНЯЯ ПАНЕЛЬ: Аватар и Основная инфо -->
    <div class="profile-header">
      <div class="avatar-wrapper">
        <img v-if="auth.user.AvatarURL" :src="auth.user.AvatarURL" alt="Avatar" class="avatar" />
        <div v-else class="avatar-placeholder">{{ auth.user.Username[0].toUpperCase() }}</div>
      </div>
      
      <div class="user-main-info">
        <div class="username-row">
          <span v-if="auth.user.Title" class="user-title">{{ auth.user.Title }}</span>
          <h1>{{ auth.user.Username }}</h1>
          <span class="user-role">{{ auth.user.Role }}</span>
        </div>
        <div class="user-meta">
          <span v-if="auth.user.Country" class="meta-item">📍 {{ auth.user.Country }}</span>
          <span class="meta-item">📅 На сайте с {{ formatDate(auth.user.CreatedAt) }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button @click="auth.logout" class="logout-btn">Выйти</button>
      </div>
    </div>

    <!-- СЕТКА РЕЙТИНГОВ -->
    <div class="ratings-grid">
      <div class="rating-card blitz">
        <div class="card-icon">⚡</div>
        <div class="card-label">Blitz</div>
        <div class="card-value">{{ auth.user.EloBlitz }}</div>
        <div class="card-games">{{ auth.user.GamesBlitz }} партий</div>
      </div>

      <div class="rating-card rapid">
        <div class="card-icon">⏱</div>
        <div class="card-label">Rapid</div>
        <div class="card-value">{{ auth.user.EloRapid }}</div>
        <div class="card-games">{{ auth.user.GamesRapid }} партий</div>
      </div>

      <div class="rating-card bullet">
        <div class="card-icon">🚅</div>
        <div class="card-label">Bullet</div>
        <div class="card-value">{{ auth.user.EloBullet }}</div>
        <div class="card-games">{{ auth.user.GamesBullet }} партий</div>
      </div>

      <div class="rating-card classical">
        <div class="card-icon">🐢</div>
        <div class="card-label">Classical</div>
        <div class="card-value">{{ auth.user.EloClassical }}</div>
        <div class="card-games">{{ auth.user.GamesClassical }} партий</div>
      </div>
    </div>

    <!-- ДОПОЛНИТЕЛЬНАЯ ИНФО -->
    <div class="profile-details">
      <div class="details-section">
        <h3>Аккаунт</h3>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">{{ auth.user.Email }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ID пользователя:</span>
          <span class="detail-value">#{{ auth.user.Id }}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else-if="auth.loading" class="profile-loading">
    Загрузка профиля...
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 0 20px;
  color: #bababa;
}

/* HEADER */
.profile-header {
  display: flex;
  align-items: center;
  background: #262421;
  padding: 30px;
  border-radius: 8px;
  gap: 30px;
  margin-bottom: 25px;
  border-bottom: 4px solid #312e2b;
}

.avatar-wrapper {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.avatar, .avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.avatar-placeholder {
  background: #3e3b39;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #95bb4a;
  font-weight: bold;
}

.username-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}

.username-row h1 {
  margin: 0;
  color: #fff;
  font-size: 28px;
}

.user-title {
  background: #ca3431;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.user-role {
  color: #95bb4a;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 1px solid #95bb4a;
  padding: 2px 8px;
  border-radius: 12px;
}

.user-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #999;
}

.header-actions {
  margin-left: auto;
}

.logout-btn {
  background: transparent;
  border: 1px solid #444;
  color: #ccc;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #ca3431;
  border-color: #ca3431;
  color: #fff;
}

/* RATINGS GRID */
.ratings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.rating-card {
  background: #262421;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s;
  border: 1px solid #312e2b;
}

.rating-card:hover {
  transform: translateY(-5px);
  border-color: #444;
}

.card-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.card-label {
  font-size: 14px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 5px;
}

.card-games {
  font-size: 12px;
  color: #666;
}

/* Разные цвета для акцента при наведении (опционально) */
.rating-card.blitz:hover { border-bottom: 3px solid #f0c15c; }
.rating-card.rapid:hover { border-bottom: 3px solid #95bb4a; }
.rating-card.bullet:hover { border-bottom: 3px solid #ca3431; }
.rating-card.classical:hover { border-bottom: 3px solid #4a6fa5; }

/* DETAILS */
.profile-details {
  background: #262421;
  padding: 25px;
  border-radius: 8px;
  border: 1px solid #312e2b;
}

.details-section h3 {
  margin-top: 0;
  color: #fff;
  border-bottom: 1px solid #312e2b;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #2a2825;
}

.detail-label { color: #666; }
.detail-value { color: #ddd; font-family: monospace; }

@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  .username-row {
    justify-content: center;
  }
  .user-meta {
    flex-direction: column;
    gap: 5px;
  }
  .header-actions {
    margin: 0;
    width: 100%;
  }
  .logout-btn { width: 100%; }
}
</style>