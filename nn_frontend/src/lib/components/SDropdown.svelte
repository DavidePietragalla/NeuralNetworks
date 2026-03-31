<script lang="ts">
  import type { Diagram } from "$lib/diagram.svelte";
  import type { Stereotype } from "$lib/model/stereotype";
  let selectedStereotype = $state("agg-layer");

  interface Props {
    // stereotypes: Stereotype[];
    diagram: Diagram;
  }

  let { diagram }: Props = $props();
</script>

<select name="stereotypes" id="stereotypes" bind:value={selectedStereotype}>
  <option value="agg-layer" selected>-- aggiungi layer --</option>
  {#each diagram.stereotypes as stereotype}
    <option
      value={stereotype}
      onclick={() => diagram.addModule(selectedStereotype)}
    >
      {stereotype.getName()}
    </option>
  {/each}
</select>

<style>
  @import "../styles/dropdown.css";
</style>
