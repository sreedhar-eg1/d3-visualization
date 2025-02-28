import { EventEmitter, Injectable } from '@angular/core';
import ObjectHelper from '../helpers/object.helper';

import { Selection } from 'd3-selection'
import * as d3 from 'd3';
import { LegendConfig } from '../interfaces/legend.interfaces';

export enum LegendActionTypes {
  LegendItemHighlighted = '[Legend service] item highlighted',
  LegendItemClicked = '[Legend service] item clicked',
  LegendItemReset = '[Legend service] item reset'
}

export class LegendItemHighlighted {
  readonly type = LegendActionTypes.LegendItemHighlighted;

  constructor(public payload: { item: any }) {}
}

export class LegendItemClicked {
  readonly type = LegendActionTypes.LegendItemClicked;

  constructor(public payload: { item: any }) {}
}

export class LegendItemReset {
  readonly type = LegendActionTypes.LegendItemReset;

  constructor(public payload: { item: any }) {}
}


export type LegendActions = LegendItemHighlighted
  | LegendItemClicked
  | LegendItemReset;

@Injectable()
export abstract class LegendService<D, C extends LegendConfig> {
  host: Selection<SVGGElement, any, any, any> = {} as any
  private _data: D = undefined as any
  private _config: C = undefined as any

  protected abstract defaultData: D
  protected abstract defaultConfig: C

  set data(data: D) {
    this._data = data
    this.onUpdateData()
  }

  get data() {
    return this._data || this.defaultData
  }

  set config(config: C) {
    this._config = ObjectHelper.UpdateObjectWithPartialValues(this.defaultConfig, config)
    this.onUpdateConfig()
  }

  get config() {
    return this._config || this.defaultConfig
  }

  onLegendAction = new EventEmitter<LegendActions>()

  hiddenIds = new Set()

  constructor() { } 

  setItems = () => {
    const data: any = this.getItems()

    this.host.selectAll('g.legend-item')
      .data(data)
      .join(
        (enter: any) => enter.append('g')
        .call(this.generateItem),
        (update: any) => update
        .call(this.updateItem)
      )
      .attr('class', 'legend-item')
      .style('cursor', this.config.item.cursor)
      // .attr('transform', (d: any, i: number) => `translate(${i * width + (i && nodataSeparator || 0)}, 0)`)
      .on('mouseenter', (event: MouseEvent, d: any) => {
        this.onMouseEnter(event, d)
      })
      .on('mouseleave', (event: MouseEvent, d: any) => {
        this.onMouseLeave(event, d)
      })
      .on('click', (event: MouseEvent, d: any) => {
        this.onMouseClick(event, d)
      });
  }

  repositionItems = () => {
    let padding = 0
    const separator = this.config.item.separator

    this.host.selectAll('g.legend-item').each((d: any, i: number, items: any) => {
      const g = d3.select(items[i]).attr('transform', `translate(${padding}, 0)`)
      const dims = g.node()?.getBoundingClientRect() || new DOMRect()
      padding += dims.width + separator
    })
  }

  generate = () => {
    this.setItems()
    this.repositionItems()
  }

  toggleItem = (id: any) => {
    this.hiddenIds.has(id) ? this.hiddenIds.delete(id) : this.hiddenIds.add(id)
  }

  abstract onUpdateData:() => void
  abstract onUpdateConfig:() => void

  abstract generateItem: (selection: any) => void
  abstract updateItem: (selection: any) => void
  abstract updateItemStyles: () => void

  abstract getItems: () => any

  abstract onMouseEnter: (event: MouseEvent, d: any) => void
  abstract onMouseLeave: (event: MouseEvent, d: any) => void
  abstract onMouseClick: (event: MouseEvent, d: any) => void
}
