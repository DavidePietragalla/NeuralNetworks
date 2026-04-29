import { ENode } from "./node";
import { Module } from "./module";
import { Join } from "./join";
import type { Diagram } from "../diagram.svelte";
import type { Stereotype } from "./stereotype";

/**
 * A tree node representing either a collapsed sequential block or a branching point.
 * - If sequential: contains multiple layers that are collapsed into one logical unit
 * - If fork/join: contains branches that split or merge the data flow
 */
export class NNTreeNode {
  public id: string;
  public parentId: string | null;
  public children: NNTreeNode[];
  public data: SequentialData | ForkData | JoinData | ModuleData | EmptyData;
  public inputNodes: string[]; // For tracking which nodes feed into this node

  constructor(id: string, parentId: string | null = null) {
    this.id = id;
    this.parentId = parentId;
    this.children = [];
    this.data = { type: "empty" };
    this.inputNodes = [];
  }

  addChild(child: NNTreeNode): void {
    child.parentId = this.id;
    this.children.push(child);
  }

  addInputNode(nodeId: string): void {
    if (!this.inputNodes.includes(nodeId)) {
      this.inputNodes.push(nodeId);
    }
  }

  removeChild(childId: string): boolean {
    const index = this.children.findIndex((c) => c.id === childId);
    if (index !== -1) {
      this.children.splice(index, 1);
      return true;
    }
    return false;
  }

  isSequential(): boolean {
    return (this.data as SequentialData).type === "sequential";
  }

  isFork(): boolean {
    return (this.data as ForkData).type === "fork";
  }

  isJoin(): boolean {
    return (this.data as JoinData).type === "join";
  }

  isModule(): boolean {
    return (this.data as ModuleData).type === "module";
  }

  isEmpty(): boolean {
    return (this.data as any).type === "empty";
  }
}

/**
 * Data structures for different node types
 */

// Sequential block containing multiple layers
export interface SequentialData {
  type: "sequential";
  layers: ModuleData[];
}

// Fork node with multiple output branches
export interface ForkData {
  type: "fork";
  branches: NNTreeNode[]; // Multiple paths from this point
}

// Join node with multiple input branches
export interface JoinData {
  type: "join";
  joinType: "add" | "concat" | "average";
  inputNodes: string[]; // IDs of nodes being joined
  outputChannel?: number; // Track output channel count for validation
}

// Empty data for initial node state
export interface EmptyData {
  type: "empty";
}

// Single module layer
export interface ModuleData {
  type: "module";
  moduleId: string;
  name: string;
  stereotype: Stereotype;
  params: any;
}

/**
 * NNTree - Neural Network Tree
 *
 * Converts a diagram (directed graph) into a tree structure where:
 * - Sequential layers are collapsed into single "sequential" nodes
 * - Fork/Join nodes represent branching/merging points
 * - The resulting tree can be easily serialized to YAML
 *
 * This structure makes it easier to:
 * 1. Handle complex architectures with branches
 * 2. Generate proper Hydra configs with nested structures
 * 3. Manage input/output channel validation across branches
 */
export class NNTree {
  private root: NNTreeNode;
  private nodeMap: Map<string, NNTreeNode>;
  private lossNode: Module | null = null;
  private hasFork: boolean = false;
  private channelMap: Map<string, number> = new Map(); // Track output channels per node

  constructor(diagram: Diagram) {
    this.nodeMap = new Map();
    this.root = new NNTreeNode("root");

    // Build the tree from the diagram
    this.build(diagram);
  }

  private build(diagram: Diagram): void {
    // Find all input nodes
    const inputNodes = Array.from(ENode.allNodes.values()).filter(
      (n) => (n as Module).stereotype.category.toLowerCase() === "input",
    );

    if (inputNodes.length === 0) {
      throw new Error("No input node found in diagram");
    }

    // Process each input branch
    console.log(`Found ${inputNodes.length} input node(s)`);
    for (const inputNode of inputNodes) {
      this.processNode(inputNode, this.root, new Set());
    }

    console.log(`Total nodes processed: ${ENode.allNodes.size}`);
    
    // List all nodes and their categories for debugging
    console.log("All nodes:");
    for (const [id, node] of ENode.allNodes.entries()) {
      if (node.getType() === "Module") {
        const mod = node as Module;
        const category = mod.stereotype.category || "undefined";
        console.log(`  ${id} (${mod.name}): category=${category}, hasLoss=${category.toLowerCase().includes("loss")}`);
      }
    }
    
    console.log(`Loss node found: ${this.lossNode ? this.lossNode.name : "None"}`);

    // Add loss node to the tree if it exists
    if (this.lossNode) {
      this.processLossNode(this.lossNode);
    } else {
      throw new Error("No loss node found in diagram. A loss function is required for conversion.");
    }
  }

  /**
   * Process a node and recursively build the tree
   * @param node - The ENode to process
   * @param parent - The parent tree node
   * @param visited - Set of visited node IDs to prevent cycles
   */
  private processNode(
    node: ENode,
    parent: NNTreeNode,
    visited: Set<string>,
  ): void {
    const nodeId = node.id;

    // Prevent cycles
    if (visited.has(nodeId)) {
      console.log(`Skipping already visited node: ${nodeId}`);
      return;
    }
    visited.add(nodeId);
    console.log(`Processing node: ${nodeId} (${node.getType()}), next_nodes: ${node.next_nodes.join(", ") || "none"}`);

    // Check if this is a Loss node - store it separately
    if (node.getType() === "Module") {
      const moduleNode = node as Module;
      // Check if the module has a category property (can be a string or from Stereotype object)
      let category = "";
      if (typeof moduleNode.stereotype === "object") {
        category = moduleNode.stereotype.category || "";
      } else if (typeof moduleNode.stereotype === "string") {
        category = moduleNode.stereotype;
      }
      console.log(`Checking node ${moduleNode.name} for loss: category=${category}`);
      if (category.toLowerCase().includes("loss")) {
        console.log(`Found loss node: ${moduleNode.name}`);
        this.lossNode = moduleNode;
        return;
      }
    }

    // Check if this is a Join node
    if (node.getType() === "Join") {
      // Collect all nodes that feed into this join
      const inputNodes = this.findInputNodesForJoin(node as Join);

      const joinNode = this.createJoinNode(node as Join, parent, inputNodes);

      // Process all next nodes from the join
      for (const nextId of node.next_nodes) {
        const nextNode = ENode.fromId(nextId);
        if (nextNode) {
          this.processNode(nextNode, joinNode, visited);
        }
      }
      return;
    }

    // Check if this is a Module node
    if (node.getType() === "Module") {
      const moduleNode = node as Module;

      // Check if we have a fork (multiple outgoing edges)
      if (node.next_nodes.length > 1) {
        this.hasFork = true;
        // Collect branches first by processing each next node
        const branches: NNTreeNode[] = [];
        for (const nextId of node.next_nodes) {
          const nextNode = ENode.fromId(nextId);
          if (nextNode) {
            // Create a branch node to hold this path
            const branchNode = new NNTreeNode(`branch_${nextId}`, parent.id);
            this.processNode(nextNode, branchNode, visited);
            branches.push(branchNode);
          }
        }
        // Now create the fork with collected branches
        const forkNode = this.createForkNode(parent, branches);
        return;
      }

      // Check if we should collapse into sequential block
      // Start with a sequential block containing this module
      const sequentialBlock = this.createSequentialNode(moduleNode, parent);

      // Update channel map for validation
      const outputChannels = this.extractOutputChannels(moduleNode);
      if (outputChannels !== undefined) {
        this.channelMap.set(node.id, outputChannels);
      } else {
        console.log(`WARNING: Could not extract output channels for node ${node.id}`);
      }

      // Continue processing next nodes
      if (node.next_nodes.length > 0) {
        const nextId = node.next_nodes[0];
        console.log(`From ${nodeId}, next node: ${nextId}`);
        const nextNode = ENode.fromId(nextId);
        console.log(`Next node type: ${nextNode?.getType()}`);

        if (nextNode) {
          if (nextNode.getType() === "Module") {
            // Chain: add to sequential block
            console.log(`Extending sequential with ${nextNode.id}`);
            this.extendSequential(sequentialBlock, nextNode as Module, visited);
            console.log(`Sequential extended`);
          } else if (nextNode.getType() === "Join") {
            // Branching: process join separately
            this.processNode(nextNode, sequentialBlock, visited);
          }
        }
      }
      return;
    }
  }

  /**
   * Find all nodes that feed into a join node
   */
  private findInputNodesForJoin(joinNode: Join): string[] {
    const inputs: string[] = [];
    // Look through all nodes to find those that point to this join
    for (const [id, node] of ENode.allNodes.entries()) {
      if (node.next_nodes.includes(joinNode.id)) {
        inputs.push(id);
      }
    }
    return inputs;
  }

  /**
   * Extract output channels from a module's parameters for validation
   */
  private extractOutputChannels(module: Module): number | undefined {
    const params = module.params;
    // Try to find common channel parameters
    for (const param of params) {
      if (param.name === "out_channels" || param.name === "num_embeddings") {
        return parseInt(param.value, 10);
      }
    }
    return undefined;
  }

  /**
   * Validate that channels match between connected nodes
   */
  private validateChannels(sourceNode: ENode, targetNode: ENode): boolean {
    const sourceChannels = this.channelMap.get(sourceNode.id);
    const targetChannels = this.channelMap.get(targetNode.id);

    // If we don't have channel info for either, skip validation
    if (sourceChannels === undefined || targetChannels === undefined) {
      return true;
    }

    // For join nodes, we need to check if all inputs have matching channels
    if (targetNode.getType() === "Join") {
      // All inputs to a join should have the same number of channels
      const inputNodes = this.findInputNodesForJoin(targetNode as Join);
      for (const inputId of inputNodes) {
        const inputChannels = this.channelMap.get(inputId);
        if (inputChannels !== undefined && inputChannels !== targetChannels) {
          console.warn(`Channel mismatch: input ${inputId} has ${inputChannels} channels but join expects ${targetChannels}`);
        }
      }
      return true;
    }

    // For regular module-to-module connections
    if (sourceChannels !== targetChannels) {
      console.warn(`Channel mismatch: ${sourceNode.id} outputs ${sourceChannels} but ${targetNode.id} expects ${targetChannels}`);
      return false;
    }
    return true;
  }

  /**
   * Create a sequential node (or add to existing if collapsing)
   */
  private createSequentialNode(
    moduleNode: Module,
    parent: NNTreeNode,
  ): NNTreeNode {
    const seqNode = new NNTreeNode(`seq_${moduleNode.id}`);
    seqNode.data = {
      type: "sequential",
      layers: [
        {
          type: "module",
          moduleId: moduleNode.id,
          name: moduleNode.name,
          stereotype: moduleNode.stereotype,
          params: this.serializeParams(moduleNode.params),
        },
      ],
    };

    parent.addChild(seqNode);
    this.nodeMap.set(seqNode.id, seqNode);

    return seqNode;
  }

  /**
   * Extend a sequential block by adding another module
   */
  private extendSequential(
    seqNode: NNTreeNode,
    moduleNode: Module,
    visited: Set<string>,
  ): void {
    // Check if this is a Loss node before adding to sequential block
    if (moduleNode.stereotype.category.toLowerCase().includes("loss")) {
      this.lossNode = moduleNode;
      return;
    }

    const data = seqNode.data as SequentialData;
    data.layers.push({
      type: "module",
      moduleId: moduleNode.id,
      name: moduleNode.name,
      stereotype: moduleNode.stereotype,
      params: this.serializeParams(moduleNode.params),
    });

    // Continue processing next node
    if (moduleNode.next_nodes.length > 0) {
      const nextId = moduleNode.next_nodes[0];
      const nextNode = ENode.fromId(nextId);

      if (nextNode && nextNode.getType() === "Module") {
        this.extendSequential(seqNode, nextNode as Module, visited);
      } else if (nextNode && nextNode.getType() === "Join") {
        this.processNode(nextNode, seqNode, visited);
      }
    }
  }

  /**
   * Create a join node in the tree
   * @param join - The Join node from the diagram
   * @param parent - The parent tree node
   * @param sourceNodeIds - Array of node IDs that feed into this join
   */
  private createJoinNode(join: Join, parent: NNTreeNode, sourceNodeIds: string[] = []): NNTreeNode {
    const joinNode = new NNTreeNode(join.id, parent.id);
    joinNode.data = {
      type: "join",
      joinType: "add", // Default, can be configured
      inputNodes: [...sourceNodeIds], // Populate with actual input nodes
    };

    parent.addChild(joinNode);
    this.nodeMap.set(joinNode.id, joinNode);

    return joinNode;
  }

  /**
   * Serialize module parameters to plain object
   */
  private serializeParams(params: any[]): any {
    const result: any = {};
    params.forEach((param) => {
      result[param.name] = {
        value: param.value,
        type: param.type,
      };
    });
    return result;
  }

  /**
   * Create a fork node in the tree for handling branches
   * @param parent - The parent tree node
   * @param branches - Optional array of branch nodes
   */
  private createForkNode(parent: NNTreeNode, branches: NNTreeNode[] = []): NNTreeNode {
    const forkNode = new NNTreeNode(`fork_${Date.now()}`, parent.id);
    forkNode.data = {
      type: "fork",
      branches: branches,
    };

    parent.addChild(forkNode);
    this.nodeMap.set(forkNode.id, forkNode);

    return forkNode;
  }

  /**
   * Process the loss node and add it to the tree
   */
  private processLossNode(lossNode: Module): void {
    const lossSeqNode = new NNTreeNode(`loss_seq_${lossNode.id}`);
    lossSeqNode.data = {
      type: "sequential",
      layers: [
        {
          type: "module",
          moduleId: lossNode.id,
          name: lossNode.name,
          stereotype: lossNode.stereotype,
          params: this.serializeParams(lossNode.params),
        },
      ],
    };

    this.root.addChild(lossSeqNode);
    this.nodeMap.set(lossSeqNode.id, lossSeqNode);
  }

  /**
   * Flatten sequential blocks into a list of layers for the output
   */
  private flattenLayers(node: NNTreeNode): Array<{ id: string; name: string; target: string; params: any }> {
    const layers: Array<{ id: string; name: string; target: string; params: any }> = [];
    
    const traverse = (n: NNTreeNode) => {
      if (n.isSequential()) {
        const data = n.data as SequentialData;
        layers.push(...data.layers.map((layer) => ({
          id: layer.moduleId,
          name: layer.name,
          target: layer.stereotype.pythonClassName,
          params: layer.params,
        })));
      } else {
        // Recursively traverse children for forks/joins
        n.children.forEach(traverse);
      }
    };
    
    traverse(node);
    return layers;
  }

  /**
   * Convert the tree to a structure suitable for YAML export
   * Produces a flat network array and separate loss object
   */
  public toYamlStructure(): any {
    // Collect all layers from sequential nodes
    const network: Array<{ id: string; name: string; target: string; params: any }> = [];
    
    const traverse = (node: NNTreeNode) => {
      if (node.isSequential()) {
        const data = node.data as SequentialData;
        network.push(...data.layers.map((layer) => ({
          id: layer.moduleId,
          name: layer.name,
          target: layer.stereotype.pythonClassName,
          params: layer.params,
        })));
      } else {
        // For forks and joins, traverse children
        node.children.forEach(traverse);
      }
    };

    // Start from root's children
    for (const child of this.root.children) {
      // Skip loss sequential nodes - they are handled separately
      if (child.isSequential()) {
        const data = child.data as SequentialData;
        // Check if this sequential node contains only a loss (by name or by being the loss node)
        if (data.layers.length === 1) {
          const layer = data.layers[0];
          // Check if the layer name matches the loss node name, or if it contains "loss" in category
          if (layer.name === this.lossNode?.name) {
            continue; // Skip this child, it's the loss node
          }
        }
      }
      traverse(child);
    }

    // Build the result
    const result: any = {
      network: network,
    };

    if (this.lossNode) {
      const paramsObj: Record<string, any> = {};
      this.lossNode.params.forEach((p) => {
        paramsObj[p.name] = {
          value: p.value,
          type: p.type,
        };
      });
      result.loss = {
        id: `loss_${this.lossNode.id}`,
        name: this.lossNode.name,
        target: this.lossNode.stereotype.pythonClassName,
        params: paramsObj,
      };
    }

    return result;
  }

  /**
   * Export as JSON string for file saving
   */
  public toJSON(): string {
    return JSON.stringify(this.toYamlStructure(), null, 2);
  }

  /**
   * Get all nodes in the tree
   */
  public getAllNodes(): NNTreeNode[] {
    const nodes: NNTreeNode[] = [];
    const traverse = (node: NNTreeNode) => {
      nodes.push(node);
      node.children.forEach(traverse);
    };
    traverse(this.root);
    return nodes.slice(1); // Exclude root
  }

  /**
   * Find a node by ID
   */
  public findNode(nodeId: string): NNTreeNode | undefined {
    return this.nodeMap.get(nodeId);
  }

  /**
   * Print tree structure (for debugging)
   */
  public printTree(indent: string = ""): string {
    const lines: string[] = [];
    const traverse = (node: NNTreeNode, depth: number) => {
      const prefix = indent + "  ".repeat(depth);

      if (node.isSequential()) {
        const data = node.data as SequentialData;
        lines.push(`${prefix}[SEQUENTIAL] ${node.id}`);
        data.layers.forEach((layer) => {
          lines.push(`${prefix}  - [MODULE] ${layer.name}`);
        });
      } else if (node.isJoin()) {
        const data = node.data as JoinData;
        lines.push(`${prefix}[JOIN] ${node.id} (${data.joinType})`);
      } else if (node.isFork()) {
        const data = node.data as ForkData;
        lines.push(`${prefix}[FORK] ${node.id}`);
      } else {
        lines.push(`${prefix}[${node.data.type.toUpperCase()}] ${node.id}`);
      }

      node.children.forEach((child) => traverse(child, depth + 1));
    };

    this.root.children.forEach((child) => traverse(child, 0));
    return lines.join("\n");
  }
}

/**
 * Static utility functions for NNTree operations
 */
export namespace NNTreeUtils {
  /**
   * Collapse sequential modules into a single config block
   */
  export function collapseSequential(layers: Module[]): any {
    const config: any = {
      type: "sequential",
      layers: layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        target: layer.stereotype.pythonClassName,
        params: layer.params.reduce((acc, param) => {
          acc[param.name] = {
            value: param.value,
            type: param.type,
          };
          return acc;
        }, {} as any),
      })),
    };
    return config;
  }

  /**
   * Generate a unique ID for a new sequential block
   */
  export function generateSequentialId(): string {
    return `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique ID for a new join node
   */
  export function generateJoinId(): string {
    return `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
