<script lang="ts">
  import SDropdown from "./SDropdown.svelte";
  import type { Diagram } from "$lib/diagram.svelte";
  import type { Stereotype } from "$lib/model/stereotype";

  interface Props {
    diagram: Diagram;
    onSuccess?: () => void;
  }

  let { diagram, onSuccess }: Props = $props();

  let name: string = $state("");
  let selection: Stereotype | null = $state(null);

  let nodeColor: string = $state("#4779c4");
  let nodeWidth: number = $state(100);
  let nodeHeight: number = $state(60);

  let parameterValues: Record<string, string> = $state({});

  $effect(() => {
    if (selection) {
      let initialValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(selection.parameters)) {
        initialValues[key] = value.default;
      }
      parameterValues = initialValues;

      if (selection.view) {
        nodeColor = selection.view.color;
        nodeWidth = selection.view.width;
        nodeHeight = selection.view.height;
      }
    } else {
      parameterValues = {};
    }
  });

  function resetForm() {
    name = "";
    selection = null;
    // Il reset di selection farà scattare l'$effect che pulisce parameterValues,
    // ma ripristiniamo anche i valori di default della view per sicurezza.
    nodeColor = "#4779c4";
    nodeWidth = 100;
    nodeHeight = 60;
  }

  function handleSubmit(event: Event) {
    event.preventDefault();

    if (selection === null) {
      alert("Please choose a stereotype for the module");
      return;
    }

    const valuesToSave = $state.snapshot(parameterValues);
    const widthCssStr = `${nodeWidth}px`;
    const heightCssStr = `${nodeHeight}px`;

    // 3. Se la stringa è vuota, passiamo null per far attivare la logica
    // di default dentro la classe Module (es: Linear_1, Conv2D_2)
    const finalName = name.trim() === "" ? null : name;

    diagram.addModule(
      selection,
      finalName,
      valuesToSave,
      nodeColor,
      widthCssStr,
      heightCssStr,
    );

    // 4. Svuotiamo il form per prepararlo a una nuova interazione
    resetForm();

    if (onSuccess) {
      onSuccess();
    }
  }
</script>

<div class="flex flex-col align-middle gap-2">
  <div>
    <p class="text-sm font-medium! mb-1">Name</p>
    <input type="text" bind:value={name} class="w-full" />
  </div>

  <br />

  <div style="display: flex; gap: 15px;">
    <div style="flex: 1;">
      <p class="text-sm font-medium! mb-1">Color</p>
      <input
        type="color"
        bind:value={nodeColor}
        style="width: 100%; height: 30px; cursor: pointer;"
      />
    </div>

    <div style="flex: 1;">
      <p class="text-sm font-medium! mb-1">Width (px)</p>
      <input
        type="number"
        bind:value={nodeWidth}
        min="50"
        max="500"
        style="width: 100%; height: 30px; box-sizing: border-box;"
      />
    </div>

    <div style="flex: 1;">
      <p class="text-sm font-medium! mb-1">Height (px)</p>
      <input
        type="number"
        bind:value={nodeHeight}
        min="30"
        max="500"
        style="width: 100%; height: 30px; box-sizing: border-box;"
      />
    </div>
  </div>

  <br />

  <SDropdown {diagram} bind:selectedStereotype={selection}></SDropdown>

  <br />

  {#if selection !== null}
    <form onsubmit={handleSubmit}>
      {#each Object.entries(selection.parameters) as [key, _value]}
        <label for={key}>{key}</label>
        <input
          type="text"
          id={key}
          name={key}
          bind:value={parameterValues[key]}
        /><br /><br />
      {/each}
      <input type="submit" value="Create" />
    </form>
  {/if}
</div>
