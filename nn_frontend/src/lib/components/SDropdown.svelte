<script lang="ts">
  import type { Diagram } from "$lib/diagram.svelte";
  import type { Stereotype } from "$lib/model/stereotype";

  interface Prop {
    selectedStereotype: Stereotype | null;
    diagram: Diagram;
  }

  let { selectedStereotype = $bindable(null), diagram }: Prop = $props();
</script>

<select name="stereotypes" id="stereotypes" bind:value={selectedStereotype}>
  <option value="null" selected>-- aggiungi layer --</option>
  {#each diagram.stereotypes as stereotype}
    <option value={stereotype}>
      {stereotype.getName()}
    </option>
  {/each}
</select>

<style>
  @import "../styles/dropdown.css";
</style>
