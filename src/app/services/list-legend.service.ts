import { Injectable } from '@angular/core';
import {
  LegendItemClicked,
  LegendItemHighlighted,
  LegendItemReset,
  LegendService,
} from './legend.service';
import {
  LegendConfig,
  ListLegendConfig,
  ListLegendData,
  ListLegendItem,
} from '../interfaces/legend.interfaces';

@Injectable()
export class ListLegendService extends LegendService<ListLegendData, ListLegendConfig> {
  protected override defaultData: ListLegendData = {
    items: [],
  };
  protected override defaultConfig: ListLegendConfig = {
    item: {
      separator: 10,
      opacity: 0.3,
      cursor: 'pointer'
    },
    circle: {
      radius: 3
    },
    text: {
      separator: 5,
      font_size: 12
    },
    highlighted: {
      font_weight: 'bold'
    },
  };
;

  onUpdateData = () => {
    this.generate();
  };

  onUpdateConfig = () => {};

  generateItem = (selection: any) => {
    selection
      .append('circle')
      .attr('class', 'legend-icon')
      .attr('cx', this.config.circle.radius)
      .attr('cy', this.config.circle.radius)
      .attr('r', this.config.circle.radius)
      .style('fill', (d: any) => d.color)
      .attr('dominant-baseline', 'middle');

    selection
      .append('text')
      .attr('class', 'legend-label')
      .attr('x', 2 + this.config.circle.radius + this.config.text.separator)
      .attr('y', this.config.circle.radius)
      .style('font-size', this.config.text.font_size + 'px')
      .attr('dominant-baseline', 'middle')
      .text((d: any) => d.label);
  };

  updateItem = (selection: any) => {
    selection
      .selectAll('circle.lengend-icon')
      .style('fill', (d: any) => d.color);

    selection.select('text.legend-label').text((d: any) => d.label);
  };

  updateItemStyles = () => {
    this.host
      .selectAll<SVGGElement, ListLegendItem>('g.legend-item')
      .style('opacity', (d: ListLegendItem) => this.hiddenIds.has(d.id) ? this.config.item.opacity : null);
  };

  getItems = () => {
    return this.data.items;
  };

  onMouseEnter = (event: MouseEvent, data: ListLegendItem) => {
    this.host
      .selectAll<SVGGElement, ListLegendItem>('g.legend-item')
      .style('font-weight', (d: ListLegendItem) =>
        d.id === data.id ? this.config.highlighted.font_weight : ''
      )

    const action = new LegendItemHighlighted({ item: data.id });
    this.onLegendAction.emit(action);
  };

  onMouseLeave = (event: MouseEvent, data: any) => {
    this.host
      .selectAll<SVGGElement, ListLegendItem>('g.legend-item')
      .style('font-weight', null)

    const action = new LegendItemReset({ item: data.id });
    this.onLegendAction.emit(action);
  };

  onMouseClick = (event: MouseEvent, data: any) => {
    // version 1
    // this.toggleItem(data.id);
    // version 2
    this.naturalClick(data.id)
    this.updateItemStyles();

    const action = new LegendItemClicked({ item: data.id });
    this.onLegendAction.emit(action);
  };

  hideAllOthers = (id: any) => {
    const ids = this.data.items.filter((item) => item.id !== id).map((item) => item.id)

    this.hiddenIds = new Set(ids)
  }

  reverseHidden = () => {
    this.data.items.map((item) => this.toggleItem(item.id))
  }

  hiddenIsEmpty = (): boolean => {
    return this.hiddenIds.size === 0;
  }

  allOthersHidden = (id: any): boolean => {
    return !this.hiddenIds.has(id) && (this.hiddenIds.size === this.data.items.length -1)
  }

  naturalClick = (id: any) => {
    if (this.hiddenIsEmpty()) {
      this.hideAllOthers(id);
    } else {
      if (this.allOthersHidden(id)) {
        this.reverseHidden();
      } else {
        this.toggleItem(id);
      }
    }
  }
}
