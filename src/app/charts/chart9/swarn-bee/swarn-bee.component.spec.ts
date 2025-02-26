import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwarnBeeComponent } from './swarn-bee.component';

describe('SwarnBeeComponent', () => {
  let component: SwarnBeeComponent;
  let fixture: ComponentFixture<SwarnBeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwarnBeeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwarnBeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
