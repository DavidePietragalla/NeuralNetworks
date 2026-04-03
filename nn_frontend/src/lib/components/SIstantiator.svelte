<script lang="ts">
  import SDropdown from "./SDropdown.svelte";
  import type { Diagram } from "$lib/diagram.svelte";
  import type { Stereotype } from "$lib/model/stereotype";

  interface Props {
    diagram: Diagram;
    onSuccess?: () => void;
  }

  let { diagram, onSuccess }: Props = $props();

  let name: string | null = $state(null);
  let selection: Stereotype | null = $state(null);

  // 1. STATI PER LO STILE DEL NODO (aggiunto nodeHeight)
  let nodeColor: string = $state("#4779c4");
  let nodeWidth: number = $state(100);
  let nodeHeight: number = $state(60);

  let parameterValues: Record<string, string> = $state({});

  // 2. QUI AVVIENE LA MAGIA: Quando cambia 'selection', aggiorniamo i valori!
  $effect(() => {
    if (selection) {
      let initialValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(selection.parameters)) {
        initialValues[key] = value.default;
      }
      parameterValues = initialValues;

      // ---- PEZZO CHE MANCAVA ----
      // Se lo stereotipo ha una "view" definita nel JSON, sovrascriviamo gli stati
      if (selection.view) {
        nodeColor = selection.view.color;
        nodeWidth = selection.view.width;
        nodeHeight = selection.view.height;
      }
      // ---------------------------
    } else {
      parameterValues = {};
    }
  });

  function handleSubmit(event: Event) {
    event.preventDefault();

    if (selection === null) {
      alert("Please choose a stereotype for the module");
      return;
    }

    const valuesToSave = $state.snapshot(parameterValues);

    const widthCssStr = `${nodeWidth}px`;
    const heightCssStr = `${nodeHeight}px`;

    // 3. Aggiunto anche l'argomento heightCssStr!
    diagram.addModule(
      selection,
      name,
      valuesToSave,
      nodeColor,
      widthCssStr,
      heightCssStr,
    );

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
