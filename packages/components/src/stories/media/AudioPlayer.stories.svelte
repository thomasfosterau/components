<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import AudioPlayer from '../../lib/media/AudioPlayer.svelte';
  import { captionsVtt, chirpWav } from './tone-wav.ts';

  const { Story } = defineMeta({
    title: 'Media/AudioPlayer',
    component: AudioPlayer,
    parameters: {
      docs: {
        description: {
          component:
            'Themed controls over a native `<audio>`. With focus inside, Space or K plays, J and L skip, and M mutes; the seek arrows move five seconds. The clip here is generated in the browser.',
        },
      },
    },
  });

  const src = chirpWav(12);
</script>

<Story name="Standard" asChild>
  <AudioPlayer {src} title="Blackbird song" artist="Turdus merula" class="max-w-xl" skip={5} />
</Story>

<Story name="Compact" asChild>
  <AudioPlayer {src} title="Voice note" compact class="max-w-md" />
</Story>

<Story name="With transcript" asChild>
  <AudioPlayer {src} title="Blackbird song" artist="Turdus merula" class="max-w-xl" skip={5}>
    {#snippet transcript()}
      <p>Rising chirps, about a second and a half apart, for twelve seconds.</p>
    {/snippet}
  </AudioPlayer>
</Story>

<Story name="With captions" asChild>
  <AudioPlayer {src} captions={captionsVtt()} title="Dawn chorus" class="max-w-xl" skip={5} />
</Story>
