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

  // 1. Nuovo stato per memorizzare i valori dei parametri inseriti dall'utente
  let parameterValues: Record<string, string> = $state({});

  // 2. Quando l'utente sceglie un nuovo stereotipo, popoliamo il dizionario con i valori di default
  $effect(() => {
    if (selection) {
      let initialValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(selection.parameters)) {
        initialValues[key] = value.default;
      }
      parameterValues = initialValues;
    } else {
      parameterValues = {};
    }
  });

  // 3. Aggiungiamo l'oggetto event per prevenire il ricaricamento della pagina
  function handleSubmit(event: Event) {
    event.preventDefault();

    if (selection === null) {
      alert("Please choose a stereotype for the module");
      return;
    }

    // Ora puoi passare sia i metadati (selection, name) che le istanze dei parametri (parameterValues)
    // Usiamo $state.snapshot per passare un oggetto JS "pulito" al diagramma, rimuovendo il proxy reattivo di Svelte
    const valuesToSave = $state.snapshot(parameterValues);

    diagram.addModule(selection, name, valuesToSave);

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

  <br /><br />

  <SDropdown {diagram} bind:selectedStereotype={selection}></SDropdown>
  <br /><br />

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
