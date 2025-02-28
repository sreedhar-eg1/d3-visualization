import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import * as d3 from 'd3';
import { ChartDimensions } from 'src/app/helpers/chart.dimensions.helper';
import ObjectHelper from 'src/app/helpers/object.helper';
import { IGroupStackConfig, IGroupStackData, IGroupStackDataElem, IGroupStackRectData } from 'src/app/interfaces/chart.interfaces';
import { ITooltipData } from 'src/app/interfaces/tooltip.interfaces';

@Component({
  selector: 'app-chart7',
  template: `<svg class="chart7">
    <g class="tooltipContainer">
      <rect class="svg-tooltip__background"></rect>
      <g class="svg-tooltip">
        <text class="svg-tooltip__title"></text>
        <rect class="svg-tooltip__symbol"></rect>
        <text class="svg-tooltip__value"
          [attr.y]="config.tooltip.labels.height + config.fontSize"
          [attr.x]="config.tooltip.symbol.width + config.tooltip.labels.textSeparator"
        >
          <tspan class="svg-tooltip__value--key"></tspan>
          <tspan class="svg-tooltip__value--value"></tspan>
        </text>
      </g>
    </g>
    <style>
      .chart7 { font-size: {{config.fontSize}}px; }
      .chart7 text.title { font-weight: bold;}
      .chart7 rect { fill: unset; }
      .chart7 .svg-tooltip__value--value {
        font-size: {{config.tooltip.labels.fontSize}}px;
        font-weight: bold;
      }
      .chart7 .svg-tooltip__background {
        fill: {{config.tooltip.background.color}};
        fill-opacity: {{config.tooltip.background.opacity}};
        stroke: {{config.tooltip.background.stroke}};
        stroke-width: {{config.tooltip.background.strokeWidth}}px;
        rx: {{config.tooltip.background.rx}}px;
        ry: {{config.tooltip.background.ry}}px;
      }
      .chart7 rect.faded, .chart7 g.legend-item.faded {
        opacity: 0.3;
      }
      .chart7 rect.data {
        transition: opacity {{config.transitions.normal}};
      }
    </style>
  </svg>`,
  styles: []
})
export class Chart7Component implements OnInit, OnChanges {

  host: any;
  svg: any;

  dimensions: ChartDimensions = new ChartDimensions(new DOMRect(), {});

  // axis
  xAxis: any;
  yAxis: any;

  // containers
  xAxisContainer: any;
  yAxisContainer: any;
  dataContainer: any;
  legendContainer: any;
  tooltipContainer: any;

  // labels
  title: any;
  yLabel: any;

  // scales
  scales: any = {};

  private _defaultData: IGroupStackData = {
    title: '',
    yLabel: '',
    unit: '',
    data: [],
    stackOrder: []
  };

  private _data: IGroupStackData = {
    title: '',
    yLabel: '',
    unit: '',
    data: [],
    stackOrder: []
  };

  @Input() set data(values) {
    this._data = ObjectHelper.UpdateObjectWithPartialValues(this._defaultData, values);

    this.setStackedAndGrouped();
  };

  get data() {
    if (!this._data) { this._data = this._defaultData; }

    return this._data;
  }

  @Input() set config(values: Partial<IGroupStackConfig>) {
    this._config = ObjectHelper.UpdateObjectWithPartialValues(this._defaultConfig, values);
  }

  get config(): IGroupStackConfig {
    if (!this._config) {
      this.config = this._defaultConfig;
    }

    return this._config;
  }

  private _config: IGroupStackConfig = null as any;

  private _defaultConfig: IGroupStackConfig = {
    hiddenOpacity: 0.3,
    fontSize: 12,
    margins: {
      top: 40,
      right: 20,
      bottom: 60,
      left: 50
    },
    tooltip: {
      background: {
        xPadding: 10,
        yPadding: 10,
        color: '#fff',
        opacity: 0.9,
        stroke: '#000',
        strokeWidth: 2,
        rx: 3,
        ry: 3
      },
      title: {
        fontSize: 12,
        fontWeight: 'bold'
      },
      labels: {
        symbolSize: 6,
        fontSize: 30,
        height: 30,
        textSeparator: 10
      },
      value: {
        fontWeight: 'bold',
      },
      symbol: {
        width: 6,
        height: 6,
      },
      offset: {
        x: 20,
        y: 20
      }
    },
    transitions: {
      normal: 300,
      slow: 600
    }
  }

  stackedData: any;

  stacked: boolean = false;

  grouped: boolean = false;

  stackIds: Set<string> = new Set();
  groupIds: Set<string> = new Set();

  hiddenIds: Set<string> = new Set();

  private _filteredData: IGroupStackDataElem[] = null as any;

  get filteredData() {
    return this._filteredData || this.data.data;
  }

  set filteredData(values: IGroupStackDataElem[]) {
    this._filteredData = values;
  }

  constructor(element: ElementRef) {
    this.host = d3.select(element.nativeElement);
    
   }

  ngOnInit(): void {
    this.svg = this.host.select('svg').attr('xmlns', 'http://www.w3.org/2000/svg');
    this.setDimensions();
    this.setElements();
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
      if (!this.svg) { return; }

      this.updateChart();
  }

  setDimensions(): void {
    this.dimensions = new ChartDimensions(this.svg.node().getBoundingClientRect(), this.config.margins);
  }

  setElements(): void {

    this.svg
      .on('mousemove', this.moveTooltip);

    this.xAxisContainer = this.svg.append('g').attr('class', 'xAxisContainer')
      .attr('transform', `translate(${this.dimensions.marginLeft}, ${this.dimensions.marginBottom + 1})`);

    this.yAxisContainer = this.svg.append('g').attr('class', 'yAxisContainer')
      .attr('transform', `translate(${this.dimensions.marginLeft - 2}, ${this.dimensions.marginTop})`);

    this.dataContainer = this.svg.append('g').attr('class', 'dataContainer')
      .attr('transform', `translate(${this.dimensions.marginLeft}, ${this.dimensions.marginTop})`)
      .on('mouseleave', this.hideTooltip);

    this.legendContainer = this.svg.append('g').attr('class', 'legendContainer')
      .attr('transform', `translate(${this.dimensions.marginLeft}, ${this.dimensions.marginBottom + 30})`);

    this.title = this.svg.append('g').attr('class', 'titleContainer')
      .attr('transform', `translate(${this.dimensions.midWidth}, ${this.dimensions.midMarginTop})`)
      .append('text').attr('class', 'title')
      .style('text-anchor', 'middle');

    this.yLabel = this.svg.append('g').attr('class', 'yLabelContainer')
    .attr('transform', `translate(${this.dimensions.marginLeft - 30}, ${this.dimensions.midHeight})`)
    .append('text').attr('class', 'yLabel')
    .style('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)');

    // tooltip
    this.tooltipContainer = this.svg.select('g.tooltipContainer')
      .raise();
  }

  setParams(): void {
    // xScale
    this.setXScale();
    // yscale
    this.setYScale();
    //groupscale
    this.setGroupScale();
    //colorscale
    this.setColorScale();
  }

  setXScale(): void {
    const data = this.data.data;
    // group ids
    const domain = Array.from(new Set(data.map((d) => d.domain))).sort(d3.ascending);

    const range = [0, this.dimensions.innerWidth];
    this.scales.x = d3.scaleBand().domain(domain).range(range).paddingInner(0.2);
  }

  setYScale(): void {
    const data = this.filteredData;

    const minVal = Math.min(0, d3.min(data, (d: any) => d.value));
    const maxVal = d3.max(d3.flatRollup(data, v => d3.sum(v, d => d.value), d => d.domain, d => d.group), d => d[2]);

    const domain = [minVal, maxVal];
    const range = [this.dimensions.innerHeight, 0];

    this.scales.y = d3.scaleLinear().domain(domain as number[]).range(range);
  }

  setGroupScale(): void {
    const data = this.filteredData;

    const domain = Array.from(new Set(data.map((d) => d.group))).sort(d3.ascending);
    const range = [0, this.scales.x.bandwidth()];

    this.scales.group = d3.scaleBand().domain(domain).range(range).paddingInner(0.15);
  }

  setColorScale(): void {
    const data = this.data.data;
    const stacks = new Set(data.map((d) => d.stack));
    const n = this.stacked ? this.stackIds.size : this.groupIds.size;
    const domain = [n + 1, 0];

    this.scales.color = d3.scaleSequential(d3.interpolateSpectral).domain(domain);
  }

  setLabels(): void {
    this.title.text(this.data.title);
    this.yLabel.text(this.data.yLabel);
  }

  setAxis(): void {
    this.setXAxis();
    this.setYAxis();
  }

  setXAxis(): void {
    this.xAxis = d3.axisBottom(this.scales.x)
    .tickSizeOuter(0);

    this.xAxisContainer.call(this.xAxis);
  }

  setYAxis(): void {
    this.yAxis = d3.axisLeft(this.scales.y)
    .ticks(5)
    .tickSizeOuter(0)
    .tickSizeInner(-this.dimensions.innerWidth);

    this.yAxisContainer
    .transition()
    .duration(this.config.transitions.slow)
    .call(this.yAxis);

    this.yAxisContainer.selectAll('.tick line')
    .style('opacity', 0.3)
    .style('stroke-dasharray', '3 3');
  }

  setLegend(): void {
    if (!this.stacked && !this.grouped) {
      this.legendContainer.html('');
      return;
    }
    const data = this.data.stackOrder;

    const width = 35;
    const height = 12;
    const fontSize = 10;

    const color = (elem: any) => this.scales.color(data.indexOf(elem));

    const generateLegendItem = (selection: any) => {
      selection.append('rect')
      .attr('class', 'legend-icon')
      .attr('width', width)
      .attr('height', height)
      .style('fill', (d: any) => color(d));

      selection.append('text')
        .attr('class', 'legend-label')
        .attr('x', 0.5 * width)
        .attr('y', height + fontSize + 1)
        .style('font-size', fontSize + 'px')
        .style('text-anchor', 'middle')
        .text((d: any) => d);
    }

    const updateLegendItem = (selection: any) => {
      selection.selectAll('rect.lengend-icon')
      .style('fill', (d: any) => d.color);

      selection.select('text.legend-label')
      .text((d: any) => d);
    }

    // set item containers
    this.legendContainer.selectAll('g.legend-item')
      .data(data, (d: any) => d)
      .join(
        (enter: any) => enter.append('g')
          .call(generateLegendItem),
        (update: any) => update
          .call(updateLegendItem)
      )
      .attr('class', 'legend-item')
      .on('mouseenter', (event: any, stack: any) => {
        this.highlightSeries(stack);
        this.highlightLegendItems(stack);
      })
      .on('mouseleave', () => {
        this.resetHighlights();
        this.resetLegendItems();
      })
      .on('click', (event: any, stack: any) => this.toggleHighlight(stack));

    // reposition elements
    // a. reposition legend items
    let padding = 0;

    this.legendContainer.selectAll('g.legend-item')
    .each(function(d: any, i: number, groups: any) {
      const g = d3.select(groups[i]);
      g.attr('transform', `translate(${padding}, 0)`);

      padding += g.node().getBBox().width;
    })
    //b. reposition the legend
    const legendWidth = this.legendContainer.node().getBBox().width;

    const axisHeight = this.xAxisContainer.node().getBBox().height;
    this.legendContainer
    .attr('transform', `translate(${this.dimensions.midWidth - 0.5 * legendWidth}, ${this.dimensions.marginBottom + axisHeight + 10})`)
  }

  draw(): void {
    this.setStackedData();
    this.drawRectangles();
  }

  setStackedData(): void {
    const data = this.filteredData;
    const groupedData = d3.groups(data, d => d.domain + '__' + d.group);

    const keys = this.stacked ? this.data.stackOrder : [null]; //d3.groups(data, d => d.stack).map((d) => d[0]);
    const stack = d3.stack()
      .keys(keys as any)
      .value((element: any, key: any) => element[1].find((d: any) => d.stack === key)?.value || 0);

    this.stackedData = stack(groupedData as any)
      .flatMap((v: any) => v.map((elem: any) => {
        const [domain, group] = elem.data[0].split('__');
        const data = elem.data[1].find((d: any) => d.stack === v.key) || {
          domain,
          group,
          stack: v.key,
          key: domain + '__' + group + '__' + v.key,
          value: 0
        };
        return {
          index: this.stacked ? v.index : this.data.stackOrder.indexOf(group),
          min: elem[0],
          max: elem[1],
          ...data
        };
      })
    );

  }

  drawRectangles(): void {
    const data = this.stackedData;

    this.dataContainer.selectAll('rect.data')
    .data(data, (d: any) => d.key)
    .join(
      (enter: any) => enter.append('rect')
        .attr('y', this.scales.y(0))
        .attr('height', 0)
    )
      .attr('class', 'data')
      .attr('x', (d: any) => this.scales.x(d.domain) + this.scales.group(d.group))
      .attr('width', this.scales.group.bandwidth())
      .attr('stroke', 'white')
      .style('fill', (d: any) => this.scales.color(d.index))
      .on('mouseenter', (event: any, data: any) => {
        this.tooltip(event, data);
        this.highlightRectangle(data);
      })
      .transition()
      .duration(this.config.transitions.slow)
      .attr('y', (d: any) => this.scales.y(d.max))
      .attr('height', (d: any) => Math.abs(this.scales.y(d.min) - this.scales.y(d.max)));
  }

  updateChart(): void {
    this.setParams();
    this.setLabels();
    this.setAxis();
    this.setLegend();
    this.draw();
  }

  // tooltip
  tooltip = (event: MouseEvent, data: IGroupStackRectData): void => {
    this.showTooltip();

    const value = Math.round(10 * data.value) / 10 + ' ' + this.data.unit;

    const title = (this.grouped && this.stacked) ? data.group + ' ' + data.domain : data.domain;

    const key = this.stacked ? data.stack : (this.grouped ? data.group : null) as string;

    // convert element to tooltip data
    const tooltipData: ITooltipData = {
      title,
      color: this.scales.color(data.index),
      key,
      value
    };

    // title
    this.tooltipContainer.select('text.svg-tooltip__title')
      .attr('y', this.config.fontSize + 'px')
      .text(tooltipData.title);

    // set value

    this.tooltipContainer.select('tspan.svg-tooltip__value--key')
      .text(tooltipData.key);

    this.tooltipContainer.select('tspan.svg-tooltip__value--value')
      .text(tooltipData.value);

    // symbol
      this.tooltipContainer.select('rect.svg-tooltip__symbol')
        .attr('y', this.config.tooltip.labels.height + this.config.fontSize - this.config.tooltip.symbol.height)
        .attr('width', this.config.tooltip.symbol.width)
        .attr('height', this.config.tooltip.symbol.height)
        .style('fill', tooltipData.color);
    // set background
    const tooltipDimensions: DOMRect = this.tooltipContainer.select('g.svg-tooltip').node().getBoundingClientRect();

    this.tooltipContainer.select('rect.svg-tooltip__background')
      .attr('width', tooltipDimensions.width + 2 * this.config.tooltip.background.xPadding)
      .attr('height', tooltipDimensions.height + 2 * this.config.tooltip.background.yPadding)
      .attr('x', -this.config.tooltip.background.xPadding)
      .attr('y', -this.config.tooltip.background.yPadding);

    // resize

    // set position
    this.moveTooltip(event);

  }

  moveTooltip = (event: MouseEvent) => {
    // console.log(event);

    const position = d3.pointer(event, this.svg.node());

    const dims = this.tooltipContainer.node().getBoundingClientRect();

    let xPosition: number;
    let yPosition: number;

    if (position[0] > this.dimensions.midWidth) {
      xPosition = position[0] - dims.width;
    } else {
      xPosition = position[0] + this.config.tooltip.offset.x;
    }

    yPosition = position[1] + this.config.tooltip.offset.y - 0.5 * dims.height;

    if (yPosition + dims.height > this.dimensions.height) {
      yPosition = this.dimensions.height - dims.height;
    }

    if (yPosition < this.config.tooltip.offset.y) {
      yPosition = this.config.tooltip.offset.y;
    }

    this.tooltipContainer
    .attr('transform', `translate(${xPosition}, ${yPosition})`);
  }

  showTooltip = () => {
    this.tooltipContainer.style('visibility', null);
  }

  hideTooltip = () => {
    this.tooltipContainer.style('visibility', 'hidden');
    this.resetHighlights();
  }

  // highlight
  highlightRectangle = (data: IGroupStackRectData): void => {
    this.dataContainer.selectAll('rect.data')
      .classed('faded', (d: IGroupStackRectData) => d.key !== data.key);
  }

  highlightSeries = (stack: string): void => {
    const attr = this.stacked ? 'stack' : 'group';
    if (this.hiddenIds.has(stack)) { return; }

    this.dataContainer.selectAll('rect.data')
      .classed('faded', (d: IGroupStackRectData) => d[attr] !== stack);
  }

  highlightLegendItems = (stack: string): void => {
    if (this.hiddenIds.has(stack)) { return; }

    this.legendContainer.selectAll('g.legend-item')
    .classed('faded', (d: string) => this.hiddenIds.has(d) || d !== stack);
  }

  resetHighlights = () => {
    this.dataContainer.selectAll('rect.data')
      .classed('faded', false);
  }

  resetLegendItems = () => {
    this.legendContainer.selectAll('g.legend-item')
    .classed('faded', (d: any) => this.hiddenIds.has(d));
  }

  toggleHighlight = (stack: string): void => {
    // toggle hiddenId
    if (this.hiddenIds.has(stack)) {
      this.hiddenIds.delete(stack);
    } else {
      this.hiddenIds.add(stack);
    }

    // update filtered data
    this.filteredData = this.data.data.filter((elem: IGroupStackDataElem) => !this.hiddenIds.has(elem.stack));

    // redraw the chart
    this.updateChart();
  }

  setStackedAndGrouped = (): void => {
    this.stackIds = new Set(this.data.data.map((d) => d.stack));
    this.groupIds = new Set(this.data.data.map((d) => d.group));

    this.stacked = this.stackIds.size > 1;
    this.grouped = this.groupIds.size > 1;
  }

  data1 = [
    {
      year: 2002,
      apples: 3840,
      bananas: 1920,
      cherries: 960,
      dates: 400,
    },
    {
      year: 2003,
      apples: 1600,
      bananas: 1440,
      cherries: 960,
      dates: 400,
    },
    {
      year: 2004,
      apples: 640,
      bananas: 960,
      cherries: 640,
      dates: 400,
    },
    {
      year: 2005,
      apples: 320,
      bananas: 480,
      cherries: 640,
      dates: 400,
    },
  ];

  data2 = [
    {
      year: 2002,
      fruit: 'apples',
      value: 3840,
    },
    {
      year: 2003,
      fruit: 'apples',
      value: 1600,
    },
    {
      year: 2004,
      fruit: 'apples',
      value: 640,
    },
    {
      year: 2005,
      fruit: 'apples',
      value: 320,
    },
    {
      year: 2002,
      fruit: 'bananas',
      value: 1920,
    },
    {
      year: 2003,
      fruit: 'bananas',
      value: 1440,
    },
    {
      year: 2004,
      fruit: 'bananas',
      value: 960,
    },
    {
      year: 2005,
      fruit: 'bananas',
      value: 480,
    },
    {
      year: 2002,
      fruit: 'cherries',
      value: 960,
    },
    {
      year: 2003,
      fruit: 'cherries',
      value: 960,
    },
    {
      year: 2004,
      fruit: 'cherries',
      value: 640,
    },
    {
      year: 2005,
      fruit: 'cherries',
      value: 640,
    },
    {
      year: 2002,
      fruit: 'dates',
      value: 400,
    },
    {
      year: 2003,
      fruit: 'dates',
      value: 400,
    },
    {
      year: 2004,
      fruit: 'dates',
      value: 400,
    },
    {
      year: 2005,
      fruit: 'dates',
      value: 400,
    },
  ];

}
