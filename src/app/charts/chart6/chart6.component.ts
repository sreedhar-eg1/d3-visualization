import { style } from '@angular/animations';
import { Component, Input, OnInit, ElementRef, ViewEncapsulation, SimpleChanges, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { IPieConfig, IPieData } from 'src/app/interfaces/chart.interfaces';

import ObjectHelper from 'src/app/helpers/object.helper';
import { PieHelper } from 'src/app/helpers/pie.helper';

@Component({
  selector: 'app-chart6',
  templateUrl: './chart6.component.html',
  styleUrls: ['./chart6.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class Chart6Component implements OnInit, OnChanges {

  host: any;
  svg: any;

  // containers
  dataContainer: any;
  legendContainer: any;

  title: any;

  // functions
  pie: any;
  arc: any;
  arcTween: any;

  // scales
  colors: any;

  // state
  hiddenIds = new Set();

  @Input() data: IPieData = { title: '', data: [] };

  @Input() set config(values) {
    this._config = ObjectHelper.UpdateObjectWithPartialValues<IPieConfig>(this._defaultConfig, values);
  }

  get config() {
    return this._config || this._defaultConfig;
  }

  private _config: IPieConfig = {} as any;

  private _defaultConfig: IPieConfig = {
    innerRadiusCoef: 0.7,
    hiddenOpacity: 0.3,
    legendItem: {
      symbolSize: 10,
      height: 20,
      fontSize: 12,
      textSeparator: 15
    },
    transition: 800,
    arcs: {
      stroke: '#fff',
      strokeWidth: 2,
      radius: 6,
      padAngle: 0
    },
    margins: {
      left: 10,
      top: 40,
      right: 130,
      bottom: 10
    }
  };

  //dimensions
  dimensions: DOMRect = new DOMRect();

  innerWidth: number = 300;
  innerHeight: number = 150;
  radius: number = 3;
  innerRadius = 0;

  get margins() {
    return this.config.margins;
  }

  get ids() {
    return this.data.data.map((d) => d.id);
  }

  get pieData() {
    return this.pie(this.data.data.filter((elem) => !this.hiddenIds.has(elem.id)));
  }

  constructor(element: ElementRef) {
    this.host = d3.select(element.nativeElement);
    console.log(this);
    
   }

  ngOnInit(): void {
    this.svg = this.host.select('svg');
    this.setDimensions();
    this.setElements();
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.svg) { return ; }
    this.updateChart();
  }

  setDimensions() {
    this.dimensions = this.svg.node().getBoundingClientRect();

    this.innerWidth = this.dimensions.width - this.margins.left - this.margins.right;
    this.innerHeight = this.dimensions.height - this.margins.top - this.margins.bottom;

    this.radius = 0.5 * Math.min(this.innerWidth, this.innerHeight);
    this.innerRadius = this.config.innerRadiusCoef * this.radius;

    this.svg.attr('viewBox', [0, 0, this.dimensions.width, this.dimensions.height]);
  }

  setElements() {
    this.dataContainer = this.svg
      .append('g')
      .attr('class', 'dataContainer')
      .attr('transform', `translate(${this.margins.left + 0.5 * this.innerWidth}, ${this.margins.top + 0.5 * this.innerHeight})`);

    this.legendContainer = this.svg
      .append('g')
      .attr('class', 'legendContainer')
      .attr('transform', `translate(${this.innerWidth - 0.5 * this.margins.right}, ${this.margins.top + 0.5 * this.innerHeight})`);

    this.title = this.svg
      .append('g')
      .attr('class', 'titleContainer')
      .attr('transform', `translate(${0.5 * this.dimensions.width}, ${0.5 * this.margins.top})`)
      .append('text')
      .attr('class', 'title')
      .style('text-anchor', 'middle');
  }

  setParams() {
    //arc generator
    this.arc = d3.arc()
      .innerRadius(this.innerRadius)
      .outerRadius(this.radius)
      .cornerRadius(this.config.arcs.radius)
      .padAngle(this.config.arcs.padAngle);

    // pie generator
    this.pie = d3.pie()
      .value((d: any) => d.value)
      .sort((a: any, b: any) => d3.ascending(a.id, b.id));

    // color scale
    this.colors = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(this.ids as any);

    const chart = this;

    this.arcTween = function(d: any) {
      const current = d;
      const parent: any = this;
      const previous = parent._previous;
      const interpolate = d3.interpolate(previous, current);
      parent._previous = current;
      return function(t: number) {
        return chart.arc(interpolate(t));
      }
    }
  }

  setLabels() {
    this.title.text(this.data.title);
  }

  setLegend() {
    const data = this.data.data;

    // add legend item containers
    this.legendContainer.selectAll('g.legend-item')
      .data(data)
      .join('g')
        .attr('class', 'legend-item')
        .attr('transform', (d: any, i: number) => `translate(0, ${i * this.config.legendItem.height})`)
        .style('opacity', (d: any) => this.hiddenIds.has(d.id) ? this.config.hiddenOpacity : null)
        .on('mouseenter', (event: any, d: any) => this.setHighlights(d.id))
        .on('mouseleave', () => this.resetHighlights())
        .on('click', (event: any, d: any) => this.toggleHighlight(d.id));

    // add symbols
    this.legendContainer.selectAll('g.legend-item')
      .selectAll('rect')
      .data((d: any) => [d])
      .join('rect')
        .attr('width', this.config.legendItem.symbolSize)
        .attr('height', this.config.legendItem.symbolSize)
        .style('fill', (d: any) => this.colors(d.id));

    // add labels
    this.legendContainer.selectAll('g.legend-item')
      .selectAll('text')
      .data((d: any) => [d])
      .join('text')
      .style('font-size', this.config.legendItem.fontSize + 'px')
      .attr('x', this.config.legendItem.textSeparator)
      .attr('y', this.config.legendItem.symbolSize)
      .text((d: any) => d.label);

    // reposition legend
    const dimensions = this.legendContainer.node().getBBox();

    this.legendContainer
      .attr('transform', `translate(${this.dimensions.width - this.margins.right}, ${this.margins.top + 0.5 * this.innerHeight - 0.5 * dimensions.height})`)
  }

  draw() {
    const chart = this;

    const data = this.pieData;

    const previousData = this.dataContainer
      .selectAll('path.data')
      .data();

    const extendedPreviousData = PieHelper.ExtendPreviousDataWithEnter(previousData, data);
    const extendedCurrentData = PieHelper.ExtendCurrentDataWithExit(previousData, data);

    const enterArcTween = PieHelper.ArcTweenFactory(extendedPreviousData, true, this.arc);

    const exitArcTween = PieHelper.ArcTweenFactory(extendedCurrentData, false, this.arc);

    this.dataContainer
      .selectAll('path.data')
      .data(data, (d: any) => d.data.id)
      .join(
        (enter: any) => enter.append('path'),
        (update: any) => update,
        (exit: any) => exit.transition()
          .duration(1000)
          .attrTween('d', exitArcTween)
          .remove()
      )
        .attr('class', 'data')
        .style('fill', (d: any) => this.colors(d.data.id))
        .style('stroke', this.config.arcs.stroke)
        .style('stroke-width', this.config.arcs.strokeWidth)
        .on('mouseenter', (event: any, d: any) => this.setHighlights(d.data.id))
        .on('mouseleave', () => this.resetHighlights())
        .transition()
        .duration(1000)
        .attrTween('d', enterArcTween);

  }

//  highlight() {}
  setHighlights(id: any) {
    if (this.hiddenIds.has(id)) { return; }

    this.dataContainer.selectAll('path.data')
    .style('opacity', (d: any) => d.data.id === id ? null : this.config.hiddenOpacity);

    this.legendContainer.selectAll('g.legend-item')
    .style('opacity', (d: any) => d.id === id ? null : this.config.hiddenOpacity);
  }

  resetHighlights() {
    this.dataContainer.selectAll('path.data')
    .style('opacity', null);

    this.legendContainer.selectAll('g.legend-item')
    .style('opacity', (d: any) => !this.hiddenIds.has(d.id) ? null : this.config.hiddenOpacity);
  }

  toggleHighlight(id: any) {
    this.hiddenIds.has(id) ? this.hiddenIds.delete(id) : this.hiddenIds.add(id);
    this.updateChart();
  }

  updateChart() {
    this.setParams();
    this.setLabels();
    this.setLegend();
    this.draw();
  }

}
