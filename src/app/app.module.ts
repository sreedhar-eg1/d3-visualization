import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Chart1Component } from './charts/chart1/chart1.component';
import { Chart2Component } from './charts/chart2/chart2.component';
import { Chart3Component } from './charts/chart3/chart3.component';
import { Chart4Component } from './charts/chart4/chart4.component';
import { Chart5Component } from './charts/chart5/chart5.component';
import { Chart6Component } from './charts/chart6/chart6.component';
import { Chart7Component } from './charts/chart7/chart7.component';
import { Chart8Component } from './charts/chart8/chart8.component';
import { TimelineTooltipComponent } from './components/timeline-tooltip/timeline-tooltip.component';
import { PlaySliderComponent } from './components/play-slider/play-slider.component';
import { SwarnBeeComponent } from './charts/chart9/swarn-bee/swarn-bee.component';

@NgModule({
  declarations: [
    AppComponent,
    Chart1Component,
    Chart2Component,
    Chart3Component,
    Chart4Component,
    Chart5Component,
    Chart6Component,
    Chart7Component,
    Chart8Component,
    TimelineTooltipComponent,
    PlaySliderComponent,
    SwarnBeeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
