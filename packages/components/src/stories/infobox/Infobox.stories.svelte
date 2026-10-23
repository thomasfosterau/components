<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Infobox from "../../lib/infobox/Infobox.svelte";
  import InfoboxRow from "../../lib/infobox/InfoboxRow.svelte";
  import InfoboxSection from "../../lib/infobox/InfoboxSection.svelte";
  import type { InfoboxRowSpec as Row } from "../../lib/infobox/types.ts";

  const { Story } = defineMeta({
    title: "Infobox/Infobox",
    component: Infobox,
    tags: ["autodocs"],
    parameters: {
      docs: {
        description: {
          component:
            "The summary rail. Fill it by composing `InfoboxSection`/`InfoboxRow` as `children`, or by handing it a typed `rows` array — both render through the same primitives.",
        },
      },
    },
  });

  const taxonRows: readonly Row[] = [
    { kind: "fact", label: "Family", value: "Solanaceae" },
    { kind: "fact", label: "Genus", value: "Solanum" },
    { kind: "fact", label: "Frost tolerance", value: undefined },
    {
      kind: "links",
      label: "Synonyms",
      links: [
        {
          label: "Lycopersicon esculentum",
          href: "/taxa/lycopersicon-esculentum",
        },
      ],
    },
  ];
</script>

<Story name="Composed, beside an article">
  <div class="prose max-w-none">
    <Infobox title="Solanum lycopersicum" subtitle="Tomato">
      <InfoboxSection title="Classification">
        <InfoboxRow label="Family" value="Solanaceae" />
        <InfoboxRow label="Genus" value="Solanum" />
        <InfoboxRow label="Rank" value="species" />
      </InfoboxSection>
      <InfoboxSection title="Cultivation">
        <InfoboxRow label="Sun" value="Full" />
        <InfoboxRow label="Sow" value="Spring" />
        <!-- Unrecorded, and shown to be: see InfoboxRow's `showEmpty`. -->
        <InfoboxRow label="Frost tolerance" showEmpty />
      </InfoboxSection>
    </Infobox>
    <p>
      The tomato is the edible berry of the plant Solanum lycopersicum,
      originating in western South America and Central America. Its many
      cultivars are grown worldwide, in greenhouses where the climate will not
      carry them outdoors.
    </p>
  </div>
</Story>

<Story name="Floated beside prose">
  <div class="prose max-w-none">
    <Infobox title="Ocimum basilicum" subtitle="Basil" float>
      <InfoboxSection>
        <InfoboxRow label="Family" value="Lamiaceae" />
        <InfoboxRow label="Sun" value="Full to part shade" />
      </InfoboxSection>
    </Infobox>
    <p>
      `float` wraps text around the box rather than sitting in its own grid
      column.
    </p>
  </div>
</Story>

<Story name="From typed rows">
  <Infobox title="Solanum lycopersicum" rows={taxonRows} />
</Story>

<Story name="As a section of the page (h2)">
  <!-- The box is a page section in its own right, so its title sits at the section level. -->
  <div class="max-w-sm">
    <h1 class="mb-4 text-2xl font-bold">Solanum lycopersicum</h1>
    <Infobox title="Key facts" headingLevel={2} rows={taxonRows} />
  </div>
</Story>

<Story name="With an identifying image">
  <Infobox
    title="Anthony Albanese"
    label="Portrait"
    image={{
      src:
        "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#e5e7eb"/><circle cx="160" cy="80" r="50" fill="#9ca3af"/></svg>',
        ),
      alt: "Portrait photograph",
      caption: "2022",
      width: 320,
      height: 200,
      eager: true,
    }}
    rows={[{ kind: "fact", label: "Electorate", value: "Grayndler" }]}
  />
</Story>

<Story name="Rows and children together">
  <Infobox
    title="Bed 3"
    rows={[{ kind: "fact", label: "Area", value: "4.2 m²" }]}
  >
    <InfoboxSection title="Notes">
      <InfoboxRow label="Last sown">
        <a class="link link-hover" href="/gardens/1/log/42">14 September</a>
      </InfoboxRow>
    </InfoboxSection>
  </Infobox>
</Story>

<Story name="Untitled, falling back to label">
  <Infobox rows={[{ kind: "fact", label: "Area", value: "4.2 m²" }]} />
</Story>
