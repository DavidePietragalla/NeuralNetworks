<script lang="ts">
  import SDropdown from "./SDropdown.svelte";
  import type { Diagram } from "$lib/diagram.svelte";
  import type { Stereotype } from "$lib/model/stereotype";
  import { ENode } from "$lib/model/node";
  import type { Module } from "$lib/model/module";

  interface Props {
    diagram: Diagram;
    editNodeId?: string | null; // NUOVA PROP
    onSuccess?: () => void;
  }

  let { diagram, editNodeId = null, onSuccess }: Props = $props();

  let name: string = $state("");
  let selection: Stereotype | null = $state(null);

  let nodeColor: string = $state("#4779c4");
  let nodeWidth: number = $state(100);
  let nodeHeight: number = $state(60);

  let parameterValues: Record<string, string> = $state({});

  // Variabili per tracciare i cambiamenti senza finire in loop infiniti
  let isEditing = $derived(editNodeId !== null);
  let oldEditId: string | null = $state(null);
  let oldSelection: Stereotype | null = $state(null);

  // EFFETTO 1: Popola il form quando viene passato un nodo da modificare
  $effect(() => {
    if (editNodeId !== oldEditId) {
      oldEditId = editNodeId;

      if (editNodeId) {
        const m = ENode.fromId(editNodeId) as Module;
        const vnode = diagram.nodes.find((n) => n.id === editNodeId);

        if (m && vnode) {
          name = m.name;
          selection =
            diagram.stereotypes.find((s) => s.getName() === m.stereotypeName) ||
            null;
          nodeColor = vnode.data.color;
          nodeWidth = parseInt(vnode.data.width);
          nodeHeight = parseInt(vnode.data.height);

          let vals: Record<string, string> = {};
          m.params.forEach((p) => {
            vals[p.name] = p.value;
          });
          parameterValues = vals;
        }
      } else {
        resetForm();
      }
    }
  });

  // EFFETTO 2: Gestisce i default se l'utente cambia manualmente lo stereotipo dal Dropdown
  $effect(() => {
    if (selection !== oldSelection) {
      oldSelection = selection;

      if (selection) {
        // Applichiamo i default SOLO se stiamo creando, oppure se stiamo modificando
        // ma l'utente ha deciso di cambiare lo stereotipo in corso d'opera.
        const isSameAsEdited =
          isEditing &&
          editNodeId &&
          (ENode.fromId(editNodeId) as Module)?.stereotypeName ===
            selection.getName();

        if (!isSameAsEdited) {
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
        }
      } else {
        parameterValues = {};
      }
    }
  });

  function resetForm() {
    name = "";
    selection = null;
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
    const finalName = name.trim() === "" ? null : name;

    // BIVIO: Creazione vs Modifica
    if (isEditing && editNodeId) {
      diagram.updateModule(
        editNodeId,
        selection,
        finalName,
        valuesToSave,
        nodeColor,
        `${nodeWidth}px`,
        `${nodeHeight}px`,
      );
    } else {
      diagram.addModule(
        selection,
        finalName,
        valuesToSave,
        nodeColor,
        `${nodeWidth}px`,
        `${nodeHeight}px`,
      );
    }

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
      <input type="submit" value={isEditing ? "Update Node" : "Create Node"} />
    </form>
  {/if}
</div>
