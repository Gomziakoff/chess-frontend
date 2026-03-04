<template>

<div class="controller">

<button @click="flip">
flip
</button>

<button
@click="game.goToFirst()"
:disabled="!game.hasPrevious"
>
⏮
</button>

<button
@click="game.goToPrevious()"
:disabled="!game.hasPrevious"
>
◀
</button>

<button
@click="game.goToNext()"
:disabled="!game.hasNext"
>
▶
</button>

<button
@click="game.goToLast()"
:disabled="!game.hasNext"
>
⏭
</button>

</div>

</template>

<script setup lang="ts">

import { useGameStore } from '../../stores/game'

const game = useGameStore()

function flip() {

  game.myColor =
    game.myColor === 'white'
      ? 'black'
      : 'white'
}

</script>