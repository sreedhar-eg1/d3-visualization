import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import * as d3 from 'd3';
import * as topojson from 'topojson';

import ObjectHelper from 'src/app/helpers/object.helper';
import { IMapConfig, IMapData } from 'src/app/interfaces/chart.interfaces';
import { DimensionsService } from 'src/app/services/dimensions.service';
import { HideMapTooltip, MapTooltipActions, ShowMapTooltip } from 'src/app/actions/map-tooltip.actions';
import { debounceTime, fromEvent, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-chart8',
  template: `<svg class="chart8">
    <style>
      .chart8 path.countries {
        fill: {{config.features.base.fill}};
        stroke: {{config.features.base.stroke}};
      }

      .chart8 path.data {
        stroke: {{config.features.data.stroke}};
      }

      .chart8 text.title {
        text-anchor: middle;
        font-size: {{config.title.fontSize}}px;
        font-weight: {{config.title.fontWeight}};
        dominant-baseline: middle;
      }

      .chart8 .highlighted rect, .chart8 path.data.highlighted {
        stroke: {{config.features.highlighted.stroke}};
      }

      .chart8 .faded {
        opacity: {{config.faded.opacity}};
      }
    </style>
  </svg>`,
  styleUrls: ['./chart8.component.scss'],
  providers: [DimensionsService]
})
export class Chart8Component implements OnInit, OnDestroy {

  host: any;
  svg: any;

  containers: any = {};
  title: any;

  projection: any;
  path: any;
  features: any;
  dataFeatures: any;

  colors: any;

  private _geodata: any;

  private _data: IMapData = {title: '', data: [], thresholds: []};

  private _config: IMapConfig = null as any;

  private _defaultConfig: IMapConfig = {
    margins: {
      top: 40,
      left: 20,
      right: 20,
      bottom: 40
    },
    title: {
      fontWeight: 'bold',
      fontSize: 12
    },
    features: {
      base: {
        stroke: '#aaa',
        fill: '#fff'
      },
      data: {
        stroke: 'none'
      },
      highlighted: {
        stroke: '#000'
      }
    },
    faded: {
      opacity: 0.3
    },
    nodata: {
      color: '#b4b4b4',
      label: 'no data'
    },
    legend: {
      width: 30,
      height: 10,
      fontSize: 10,
      nodataSeparator: 10
    },
    colors: d3.schemeOranges[9].slice()
  }

  @Input() set geodata(values) {
    this._geodata = values;
    if (!this.svg) { return; }
    this.updateChart();
  }

  @Input() set data(values) {
    this._data = values;
    if (!this.svg) { return; }
    this.updateChart();
  }

  @Input() set config(values) {
    this._config = ObjectHelper.UpdateObjectWithPartialValues(this._defaultConfig, values);
  }

  @Output() tooltip = new EventEmitter<MapTooltipActions>();

  get geodata() {
    return this._geodata;
  }

  get data() {
    return this._data;
  }

  get config() {
    return this._config || this._defaultConfig;
  }

  subscriptions: Subscription[] = [];

  constructor(element: ElementRef, public dimensions: DimensionsService) {
    this.host = d3.select(element.nativeElement);
   }

  ngOnInit(): void {

    const resize$ = fromEvent(window, 'resize');

    const subs = resize$
    .pipe(
      map((event: any) => event),
      debounceTime(500)
    )
    .subscribe(() => this.resizeChart());

    this.subscriptions.push(subs);

    this.setSvg();
    this.setDimensions();
    this.setElements();
    if (!this.geodata) { return; }
    this.updateChart();
  }

  ngOnDestroy(): void {
    this.subscriptions.map((sub) => sub.unsubscribe());
  }

  setSvg() {
    this.svg = this.host.select('svg').attr('xmlns', 'http://www.w3.org/2000/svg');
  }

  setDimensions() {
    const dimensions = this.svg.node().getBoundingClientRect();
    this.dimensions.setDimensions(dimensions);
    this.dimensions.setMargins(this.config.margins);
  }

  setElements() {
    this.containers.countries = this.svg.append('g').attr('class', 'countries');
    this.containers.countries.append('path').attr('class', 'countries');
    this.containers.data = this.svg.append('g').attr('class', 'data');
    this.containers.titleContainer = this.svg.append('g').attr('class', 'title');
    this.title = this.containers.titleContainer.append('text').attr('class', 'title');
    this.containers.legend = this.svg.append('g').attr('class', 'legend');
  }

  updateChart() {
    this.positioningElements();
    this.setParams();
    this.setDataFeatures();
    this.setLabels();
    this.setLegend();
    this.draw();
  }

  resizeChart() {
    this.setDimensions();
    this.updateChart();
  }

  positioningElements() {
    this.containers.countries.attr('transform', `translate(${this.dimensions.marginLeft}, ${this.dimensions.marginTop})`);
    this.containers.data.attr('transform', `translate(${this.dimensions.marginLeft}, ${this.dimensions.marginTop})`);
    this.containers.titleContainer.attr('transform', `translate(${this.dimensions.midWidth}, ${this.dimensions.midMarginTop})`);
    this.containers.legend.attr('transform', `translate(${this.dimensions.midWidth}, ${this.dimensions.midMarginBottom})`);
  }

  setParams() {
    this.setFeatures();
    this.setProjection();
    this.setPath();
    this.setColors();
  }

  setProjection() {
    this.projection = d3.geoEquirectangular()
      .fitSize([this.dimensions.innerWidth, this.dimensions.innerHeight], this.features);
  }

  setPath() {
    this.path = d3.geoPath(this.projection);
  }

  setColors() {
    this.colors = d3.scaleThreshold()
      .domain(this.data.thresholds.slice(2, this.data.thresholds.length))
      .range(this.config.colors as any);
  }

  color(value: number | null): string {
    if (value === null) {
      return this.config.nodata.color;
    }
    return this.colors(value);
  }

  getFeatureId(feature: any): string {
    return feature.properties.ISO3_CODE;
  }

  setFeatures(){
    if (!this.geodata) { return; }
    this.features = topojson.feature(this.geodata, this.geodata.objects['CNTR_RG_60M_2020_4326']);
  }

  setDataFeatures() {
    const ids = new Set(this.data.data.map((d) => d.id));
    this.dataFeatures = this.features.features?.filter((feature: any) => ids.has(this.getFeatureId(feature))) || [];
  }

  setLabels() {
    this.title.text(this.data.title);
  }

  setLegend() {
    const data = this.data.thresholds;

    const width = this.config.legend.width;
    const height = this.config.legend.height;
    const fontSize = this.config.legend.fontSize;
    const nodataSeparator = this.config.legend.nodataSeparator;
    const nodataLabel = this.config.nodata.label;

    const generateLegendItem = (selection: any) => {
      selection.append('rect')
      .attr('class', 'legend-icon')
      .attr('width', width)
      .attr('height', height)
      .style('fill', (d: any) => this.color(d));

      selection.append('text')
        .attr('class', 'legend-label')
        .attr('x', (d: any) => d === null ? 0.5 * width : 0)
        .attr('y', height + fontSize + 1)
        .style('font-size', fontSize + 'px')
        .style('text-anchor', 'middle')
        .text((d: any) => d === null ? nodataLabel : d);
    }

    const updateLegendItem = (selection: any) => {
      selection.selectAll('rect.lengend-icon')
      .style('fill', (d: any) => d.color);

      selection.select('text.legend-label')
      .text((d: any) => d);
    }

    // set legend items
    this.containers.legend.selectAll('g.legend-item')
      .data(data)
      .join(
        (enter: any) => enter.append('g')
        .call(generateLegendItem),
        (update: any) => update
        .call(updateLegendItem)
      )
      .attr('class', 'legend-item')
      .attr('transform', (d: any, i: number) => `translate(${i * width + (i && nodataSeparator || 0)}, 0)`)
      .on('mouseenter', (event: any, d: any) => {
        //highlight the legend items
        this.highlightLegendItems(d);
        //highlight the features
        this.highlightFeatures(d);
      })
      .on('mouseleave', () => {
        //reset the legend items
        this.resetLegendItems();
        //reset the features
        this.resetFeatures();
      });

       // reposition elements

    //b. reposition the legend
    const legendBox = this.containers.legend.node().getBBox();

    this.containers.legend
      .attr('transform', `translate(
        ${this.dimensions.midWidth - 0.5 * legendBox.width},
        ${this.dimensions.midMarginBottom - 0.5 * legendBox.height}
      )`);
  }

  highlightLegendItems = (value: number | null) => {
    const color = d3.color(this.color(value))?.toString();

    this.containers.legend.selectAll('g.legend-item')
      .classed('highlighted', (d: any, i: number, nodes: any) => {
        return d3.select(nodes[i]).select('rect').style('fill') === color;
      });
  }

  highlightFeatures = (value: number | null) => {
    const color = d3.color(this.color(value))?.toString();

    this.containers.countries.selectAll('path')
      .classed('faded', 'true');

    this.containers.data.selectAll('path.data')
      .classed('highlighted', (d: any, i: number, nodes: any) => {
       // const currentColor = this.color(this.getValueByFeature(d));
        const featureColor = d3.select(nodes[i]).style('fill');
        return featureColor === color;
      })
      .classed('faded', (d: any, i: number, nodes: any) => {
        const featureColor = d3.select(nodes[i]).style('fill');
        return featureColor !== color;
      })
  }

  resetLegendItems = () => {
    this.containers.legend.selectAll('g.legend-item')
      .classed('highlighted', false);
  }

  resetFeatures = () => {
    this.containers.countries.selectAll('path')
      .classed('faded', 'false');
    
    this.containers.data.selectAll('path.data')
      .classed('highlighted faded', false);
  }

  highlightFeature(feature: any) {
    const id = this.getFeatureId(feature);
    this.containers.data.selectAll('path.data')
      .classed('highlighted', (d: any) => this.getFeatureId(d) === id);
  }

  draw() {
    this.drawBaseLayer();
    this.drawDataLayer();
  }

  drawBaseLayer() {
    this.containers.countries.select('path.countries')
      .datum(this.features)
      .attr('d', this.path);
  }

  drawDataLayer() {
    this.containers.data.selectAll('path.data')
    .data(this.dataFeatures)
    .join('path')
    .attr('class', 'data')
    .attr('d', this.path)
    .style('fill', (d: any) => this.color(this.getValueByFeature(d)))
    .on('mouseenter', (event: MouseEvent, d: any) => {
      const currentValue = this.getValueByFeature(d);
      //highlight current feature
      this.highlightFeature(d);
      //highlight the legend item
      this.highlightLegendItems(currentValue);
      // show the tooltip
      this.showTooltip(event, d);
    })
    .on('mouseleave', () => {
      //reset the current feature
      this.resetFeatures();
      //reset he legend item
      this.resetLegendItems();
      //hide the tooltip
      this.hideTooltip();
    });
  }

  showTooltip(event: MouseEvent, feature: any) {
    // country id (iso3) // x position, y position
    const position = d3.pointer(event, this.svg.node());
    const payload = {
      id: this.getFeatureId(feature),
      x: position[0],
      y: position[1]
    };

    const action = new ShowMapTooltip(payload);
    this.tooltip.emit(action);
  }

  hideTooltip() {
    // no data needed
    const action = new HideMapTooltip();
    this.tooltip.emit(action);
  }

  getValueByFeature(feature: any): number | null {
    const id = this.getFeatureId(feature);
    return this.data.data.find((d: any) => d.id === id)?.value || null;
  }

  setScale(scale: number) {
    this.projection.scale(scale);
    this.setPath();
    this.draw();
  }

  setTranslate(x: number, y:number) {
    this.projection.translate([x, y]);
    this.setPath();
    this.draw();
  }

  setCenter(x: number, y: number) {
    this.projection.center([x, y]);
    this.setPath();
    this.draw();
  }

  setRotate(x: number, y: number, z: number) {
    this.projection.rotate([x, y, z]);
    this.setPath();
    this.draw();
  }

  setExtent(width: number, height: number) {
    this.projection.fitSize([width, height], this.features);
    this.setPath();
    this.draw();

  }
 
  setWidth(width: number) {
    this.projection.fitWidth(width, this.features);
    this.setPath();
    this.draw();

  }
  setHeight(height: number) {
    this.projection.fitHeight(height, this.features);
    this.setPath();
    this.draw();

  }

}
