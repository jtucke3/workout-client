import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFaComponent } from './two-fa-component';

describe('TwoFaComponent', () => {
  let component: TwoFaComponent;
  let fixture: ComponentFixture<TwoFaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwoFaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
