import { MarkerType } from '@xyflow/svelte';

export class VConnection {
  public id: string;
  public source: string; // Cambiato da ENode a string per compatibilità Flow
  public target: string;
  public type: string;
  public markerEnd: any;
  public style: string;

  constructor(id: string, source: string, target: string) {
    this.id = id;
    this.source = source;
    this.target = target;
    this.type = 'connection'; // Deve corrispondere alla chiave in edgeTypes

    this.markerEnd = {
      type: MarkerType.ArrowClosed,
      width: 10,
      height: 15,
      color: '#27b376',
    };

    this.style = 'stroke: #27b376; stroke-width: 2;';
  }

}
