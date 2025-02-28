import { Observable } from 'rxjs';
import { map, retry } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getJson(url: string): Observable<any> {
    return this.http.get<any>(url)
    .pipe(
      retry(3)
    );
  }

  getEmployees(): Observable<any> {
    const url = 'assets/employees.json';
    //const url = 'http://dummy.restapiexample.com/api/v1/employees';
    return this.getJson(url)
    .pipe(
      map((answer) => answer.data)
    );
  }

  getParsedData(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'text' })
    .pipe(
      retry(3),
      map((csv) => d3.csvParse(csv))
    );
  }

  getIris(): Observable<any> {
    const url = 'https://raw.githubusercontent.com/d3taviz/dashboardOne/scatterplot-init/src/assets/iris.csv';
    return this.getParsedData(url);
  ;
  }

  getCovidData(): Observable<any> {
    const url = 'https://api.covidtracking.com/v1/us/daily.json';
    return this.getJson(url);
  }

  getBrowsersData(): Observable<any> {
    const url = 'assets/browsers.json';
    return this.getJson(url);
  }

  getCountriesGeoData(): Observable<any> {
    const url = 'assets/CNTR_RG_60M_2020_4326.json';
    return this.getJson(url);
  }

  getCovidByCountry(): Observable<any> {
    const url = 'assets/megafile--deaths.json';
    return this.getJson(url);
  }

  getCountryCodes(): Observable<any> {
    const url = 'assets/mapcountries.json';
    return this.getJson(url);
  }

  getDemographics(): Observable<any> {
    const url = 'assets/demographicsByYearAndCountry.csv';
    return this.getParsedData(url);
  }
}
