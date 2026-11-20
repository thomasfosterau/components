<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import QRCode from '../../lib/media/qr/QRCode.svelte';

  const logo = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#588157"/></svg>',
  )}`;

  const { Story } = defineMeta({
    title: 'Media/QRCode',
    component: QRCode,
    parameters: {
      docs: {
        description: {
          component:
            'A value as one SVG path, named "QR code for …", with a URL also as a real link. The tile is always the light theme so scanners get dark modules on a light ground. From `@thomasfosterau/components/qr`.',
        },
      },
    },
  });
</script>

<Story name="URL" args={{ value: 'https://example.org/p/1', downloadable: true }} />

<Story name="Plant label for print">
  <div class="border-base-300 rounded-box inline-flex items-center gap-4 border p-4">
    <QRCode value="https://example.org/plants/black-krim" size={96} showValue />
    <div>
      <p class="font-semibold">Tomato 'Black Krim'</p>
      <p class="text-sm">Bed 4 · sown 12 October</p>
    </div>
  </div>
</Story>

<Story name="With a logo" args={{ value: 'https://example.org/p/1', logo: { src: logo } }} />

<Story name="Expiring sign-in code" args={{ value: 'https://example.org/login/abc123', status: 'expired', onRefresh: () => undefined }} />

<Story name="In the dark theme">
  <div data-theme="dark" class="bg-base-100 text-base-content p-6">
    <QRCode value="https://example.org/p/1" showValue />
  </div>
</Story>
