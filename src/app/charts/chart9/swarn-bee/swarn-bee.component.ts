import { Component, ElementRef } from '@angular/core';
import { Chart } from '../../chart';
import {
  ISimulatedSwarmDataElement,
  ISwarmData,
  ISwarmDataElement,
} from 'src/app/interfaces/chart.interfaces';
import { DimensionsService } from 'src/app/services/dimensions.service';
import * as d3 from 'd3';
import { ListLegendService } from 'src/app/services/list-legend.service';
import {
  LegendActions,
  LegendActionTypes,
} from 'src/app/services/legend.service';
import { TooltipService } from 'src/app/services/tooltip.service';
import {
  XTooltipPosition,
  YTooltipPosition,
} from 'src/app/interfaces/tooltip.interfaces';

@Component({
  selector: 'app-swarn-bee',
  templateUrl: './swarn-bee.component.html',
  styleUrls: ['./swarn-bee.component.scss'],
  providers: [DimensionsService, ListLegendService],
})
export class SwarnBeeComponent extends Chart<ISwarmData, any> {
  constructor(
    element: ElementRef,
    dimensionsService: DimensionsService,
    protected legend: ListLegendService,
    protected tooltip: TooltipService
  ) {
    super(element, dimensionsService);
  }

  protected _defaultConfig = {
    margins: {
      top: 30,
      bottom: 50,
      left: 50,
      right: 20,
    },
  };

  groups: Array<string | number> = [];

  scaledData: ISimulatedSwarmDataElement[] = [];

  setElements = () => {
    this.svg
      .append('g')
      .attr('class', 'title')
      .append('text')
      .attr('class', 'title label');
    this.svg.append('g').attr('class', 'xAxis');
    this.svg.append('g').attr('class', 'yAxis');
    this.svg
      .append('g')
      .attr('class', 'yLabel')
      .append('text')
      .attr('class', 'yLabel label')
      .attr('transform', 'rotate(-90)');
    this.svg.append('g').attr('class', 'data');
    this.legend.host = this.svg.append('g').attr('class', 'legend');
    this.svg
      .select('g.data')
      .append('path')
      .attr('class', 'timeseries')
      .style('visibility', 'hidden');

    this.tooltip.host = this.svg
      .append('g')
      .attr('class', 'tooltip-service')
      .style('visibility', 'hidden');
  };

  positionElements = () => {
    this.svg
      .select('g.title')
      .attr(
        'transform',
        `translate(${this.dimensionsService.midWidth}, ${this.dimensionsService.midMarginTop})`
      );
    this.svg
      .select('g.xAxis')
      .attr(
        'transform',
        `translate(${this.dimensionsService.marginLeft}, ${this.dimensionsService.marginBottom})`
      );
    this.svg
      .select('g.yAxis')
      .attr(
        'transform',
        `translate(${this.dimensionsService.marginLeft}, ${this.dimensionsService.marginTop})`
      );
    this.svg
      .select('g.yLabel')
      .attr(
        'transform',
        `translate(${12 + 5}, ${this.dimensionsService.midHeight})`
      );
    this.svg
      .select('g.data')
      .attr(
        'transform',
        `translate(${this.dimensionsService.marginLeft}, ${this.dimensionsService.marginTop})`
      );
  };

  setParams = () => {
    this.setGroups();
    this.setScales();
    this.setScaledData();
    this.setSimulatedData();
    this.setAxis();
  };

  setGroups = () => {
    // with group we get in map format
    // this.groups = d3.group(this.data.data, (d: ISwarmDataElement) => d.group)
    // with groups it return nested array
    this.groups = d3
      .groups(this.data.data, (d: ISwarmDataElement) => d.group)
      .map((d) => d[0])
      .sort(d3.ascending);
  };

  setScales = () => {
    this.setXScale();
    this.setYScale();
    this.setColorScale();
  };

  setXScale = () => {
    const domain = d3
      .groups(this.data.data, (d: ISwarmDataElement) => d.category)
      .map((d) => d[0])
      .sort(d3.ascending);
    const range = [0, this.dimensionsService.innerWidth];

    this.scales['x'] = d3
      .scalePoint<string | number>()
      .domain(domain)
      .range(range)
      .padding(0.5);
  };

  setYScale = () => {
    // extent gives min and max of particular range
    let [min, max] = d3.extent(
      this.data.data,
      (d: ISwarmDataElement) => d.value
    );
    min = Math.min(min || 0, 0);

    const domain = [min === undefined ? 0 : min, max === undefined ? 1 : max];
    const range = [this.dimensionsService.innerHeight, 0];

    this.scales['y'] = d3.scaleLinear().domain(domain).range(range);
  };

  setColorScale = () => {
    const domain = this.groups;
    const range = d3.schemeTableau10;

    this.scales.colors = d3
      .scaleOrdinal<string | number, string>()
      .domain(domain)
      .range(range);
  };

  setScaledData = () => {
    this.scaledData = this.data.data.map((d: ISwarmDataElement) => ({
      ...d,
      cx: this.scales.x(d.category),
      cy: this.scales.y(d.value),
      index: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }));
  };

  setSimulatedData = () => {
    const data = this.scaledData;

    const simulation = d3
      .forceSimulation<any>(data)
      .force('x', d3.forceX((d: any) => d.cx).strength(0.8))
      .force('y', d3.forceY((d: any) => d.cy).strength(1))
      .force('collide', d3.forceCollide(2))
      .stop();

    simulation.tick(50);

    // let i = 0;

    // const interval = setInterval(() => {
    //   if (i > 50) {
    //     clearInterval(interval);
    //   }
    //   i++;
    //   simulation.tick();
    //   this.runSimulation();
    // }, 500);
  };

  runSimulation = () => {
    const data = this.scaledData;

    this.svg
      .select('g.data')
      .selectAll('circle.data')
      .data(data)
      .join('circle')
      .attr('class', 'data')
      .attr('fill', (d: any) => this.scales.colors(d.group))
      .attr('r', 2)
      .transition()
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);
  };

  setAxis = () => {
    const xAxis = d3.axisBottom(this.scales.x).tickSizeOuter(0);
    this.svg.select<SVGGElement>('g.xAxis').call(xAxis);

    const yAxis = d3
      .axisLeft(this.scales.y)
      .tickSizeOuter(0)
      .tickSizeInner(-this.dimensionsService.innerWidth);
    this.svg.select<SVGGElement>('g.yAxis').call(yAxis);

    this.svg
      .select('g.yAxis')
      .selectAll('.tick line')
      .style('stroke', '#ddd')
      .style('stroke-dasharray', '2 2');
  };

  setLabels = () => {
    this.svg.select('text.title').text(this.data.title);
    this.svg.select('text.yLabel').text(this.data.unit);
  };

  setLegend = () => {
    // set the legend data
    const items = this.groups.map((d: string | number) => ({
      color: this.scales.colors(d),
      id: d,
      label: d + '',
    }));

    this.legend.data = {
      items,
    };

    const dims =
      this.legend.host.node()?.getBoundingClientRect() || new DOMRect();

    this.svg
      .select('g.legend')
      .attr(
        'transform',
        `translate(${this.dimensionsService.midWidth - 0.5 * dims.width}, ${
          this.dimensionsService.bottom - dims.height - 5
        })`
      );
  };

  draw = () => {
    const data = this.scaledData;
    this.svg
      .select('g.data')
      .selectAll<SVGCircleElement, ISimulatedSwarmDataElement>('circle.data')
      .data(data)
      .join('circle')
      .attr('class', 'data')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('fill', (d) => this.scales.colors(d.group))
      .attr('r', 3)
      .on('mouseenter', this.onMouseEnter)
      .on('mouseleave', this.onMouseLeave);
  };

  onSetData = () => {
    if (!this.chartIsInitialized || !this.dataIsInitialized) {
      return;
    }

    this.updateChart();
  };

  onSetConfig = () => {};

  override setSubscriptions(): void {
    super.setSubscriptions();

    const sub = this.legend.onLegendAction.subscribe(this.onLegendAction);
    this.subscribe(sub);
  }

  onLegendAction = (action: LegendActions) => {
    switch (action.type) {
      case LegendActionTypes.LegendItemHighlighted:
        this.highlightGroup(action.payload.item);
        break;
      case LegendActionTypes.LegendItemClicked:
      case LegendActionTypes.LegendItemReset:
      default:
        this.resetHighlights();
        break;
    }
  };

  // highlight methods
  highlightGroup = (id: string | number) => {
    if (this.legend.hiddenIds.has(id)) return;

    this.host
      .select('g.data')
      .selectAll<SVGCircleElement, ISimulatedSwarmDataElement>('circle.data')
      .style('opacity', (d: ISimulatedSwarmDataElement) =>
        !this.legend.hiddenIds.has(d.group) && d.group === id ? null : 0.3
      );
  };

  resetHighlights = () => {
    this.host
      .select('g.data')
      .selectAll<SVGCircleElement, ISimulatedSwarmDataElement>('circle.data')
      .style('opacity', (d: ISimulatedSwarmDataElement) =>
        this.legend.hiddenIds.has(d.group) ? 0.3 : null
      )
      .style('stroke', null)
      .attr('r', 2);
  };

  setLine = (item: ISimulatedSwarmDataElement) => {
    const line = d3
      .line<ISimulatedSwarmDataElement>()
      .x((d) => d.x)
      .y((d) => d.y);

    const data = this.scaledData
      .filter((data) => data.id === item.id)
      .sort((a, b) => a.x - b.x);

    this.svg
      .select<SVGPathElement>('path.timeseries')
      .datum(data)
      .attr('d', line)
      .style('fill', 'none')
      .style('stroke', '#000')
      .style('visibility', 'visible')
      .raise();
  };

  // item highlight method
  onMouseEnter = (event: MouseEvent, item: ISimulatedSwarmDataElement) => {
    if (this.legend.hiddenIds.has(item.group)) return;

    // highlight corresponding circle
    this.host
      .select('g.data')
      .selectAll<SVGCircleElement, ISimulatedSwarmDataElement>('circle.data')
      .style('opacity', (d: ISimulatedSwarmDataElement) =>
        d.id === item.id ? null : 0.3
      )
      .style('stroke', (d: ISimulatedSwarmDataElement) =>
        d.id === item.id ? '#000' : null
      )
      .attr('r', (d: ISimulatedSwarmDataElement) => (d.id === item.id ? 3 : 2));

    // add a line with the time series
    this.setLine(item);

    // raise the highlighted circle to the top
    this.host
      .select('g.data')
      .selectAll<SVGCircleElement, ISimulatedSwarmDataElement>('circle.data')
      .filter((d: ISimulatedSwarmDataElement) => d.id === item.id)
      .raise();

    // set the tooltip
    this.setTooltip(event, item);
  };

  onMouseLeave = (event: MouseEvent, item: ISimulatedSwarmDataElement) => {
    // remove highlight
    this.resetHighlights();

    //  remove the time series line
    this.svg
      .select<SVGPathElement>('path.timeseries')
      .style('visibility', 'hidden');

    //remove tooltip
    this.svg.select('g.tooltip-service').style('visibility', 'hidden');
  };

  // tooltip methods
  setTooltip = (event: MouseEvent, item: ISimulatedSwarmDataElement) => {
    // set the data
    this.tooltip.data = {
      title: item.category + '',
      color: this.scales.colors(item.group),
      key: item.label,
      value: item.value,
    };
    // position the tooltip
    this.moveTooltip(event);

    // show the tooltip
    this.svg.select('g.tooltip-service').style('visibility', 'visible');
  };

  moveTooltip = (event: MouseEvent) => {
    const coords = d3.pointer(event, this.svg.node());

    const position = {
      x: coords[0],
      y: coords[1],
      xPosition: this.xTooltipAlignment(coords[0]),
      yPosition: this.yTooltipAlignment(coords[1]),
    };

    this.tooltip.position = position;
  };

  xTooltipAlignment = (x: number): XTooltipPosition => {
    /*     if (x > this.dimensions.midWidth) {
          return XTooltipPosition.left;
        } else {
          return XTooltipPosition.right;
        } */

    return x > this.dimensionsService.midWidth
      ? XTooltipPosition.left
      : XTooltipPosition.right;
  };

  yTooltipAlignment = (x: number): YTooltipPosition => {
    return x > this.dimensionsService.midHeight
      ? YTooltipPosition.top
      : YTooltipPosition.bottom;
  };
}
