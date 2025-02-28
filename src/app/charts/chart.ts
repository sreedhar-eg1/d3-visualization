import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import * as d3 from 'd3';
import { Selection } from 'd3-selection';
import { debounceTime, fromEvent, map, Subscription } from 'rxjs';
import { IBaseConfig } from '../interfaces/chart.interfaces';
import { DimensionsService } from '../services/dimensions.service';
import ObjectHelper from '../helpers/object.helper';

@Directive()
export abstract class Chart<D, C extends IBaseConfig>
  implements OnInit, OnDestroy
{
  private _data: D = null as any;
  private _config: C = null as any;

  @Input() set data(data) {
    this._data = data;
    this.dataIsInitialized = true;
    this.onSetData();
    // if (!this.chartIsInitialized) {
    //   return;
    // }
    // this.updateChart();
  }

  get data() {
    return this._data;
  }

  @Input() set config(config) {
    this._config = ObjectHelper.UpdateObjectWithPartialValues(
      this._defaultConfig,
      config
    );
    this.onSetConfig();
  }

  get config() {
    return this._config || this._defaultConfig;
  }

  @Output() events = new EventEmitter<any>();

  // Elements
  protected host: Selection<any, any, any, any> = null as any;
  protected svg: Selection<SVGSVGElement, any, any, any> = null as any;

  private subscriptions: Subscription[] = [];

  chartIsInitialized: boolean = false;
  dataIsInitialized: boolean = false;

  scales: any = {};

  protected abstract _defaultConfig: C;

  constructor(
    elementRef: ElementRef,
    protected dimensionsService: DimensionsService
  ) {
    this.host = d3.select(elementRef.nativeElement); 
    console.log(this);
  }

  ngOnInit(): void {
    this.setSubscriptions();

    this.setSvg();;
    this.setElements();
    this.chartIsInitialized = true
    this.updateChart();
  }

  updateChart() {
    this.setDimensions();
    this.positionElements();
    this.setParams();
    this.setLabels();
    this.setLegend();
    this.draw();
  }

  // Run Once
  setSvg(): void {
    this.svg = this.host.select<SVGSVGElement>('svg')
            .attr('version', '1.1')
            .attr('baseProfile', 'full')
            .attr('xmlns', 'http://www.w3.org/2000/svg')
            .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
            .attr('xmlns:ev', 'http://www.w3.org/2001/xml-events');
  }

  setDimensions(): void {
    const dimensions = this.svg?.node()?.getBoundingClientRect() || new DOMRect(300, 150);
    this.dimensionsService.setDimensions(dimensions);
    this.dimensionsService.setMargins(this.config.margins);

    this.svg.attr('viewbox', [0,0, this.dimensionsService.width, this.dimensionsService.height])
  }

  abstract setElements: () => void;

  // run on update chart
  abstract positionElements: () => void;

  abstract setParams: () => void;

  abstract setLabels: () => void;

  abstract setLegend: () => void;

  abstract draw: () => void;

  //Subscriptions
  subscribe(sub: Subscription): void {
    this.subscriptions.push(sub);
  }

  unSubscribeAll(): void {
    this.subscriptions.map((sub) => {
        sub.unsubscribe()
    })
  }

  setSubscriptions(): void {
    this.setResize();
  }

  setResize(): void {
    const resize$ = fromEvent(window, 'resize');

    const subs = resize$
      .pipe(
        map((event: any) => event),
        debounceTime(500)
      )
      .subscribe(() => this.updateChart());

    this.subscribe(subs)
  }

  // Set data and config
  abstract onSetData: () => void;
  abstract onSetConfig: () => void;

  ngOnDestroy(): void {
    this.unSubscribeAll()
  }
}
