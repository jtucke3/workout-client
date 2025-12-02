import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Workouts } from './workouts';

describe('Workouts', () => {
  let component: Workouts;
  let fixture: ComponentFixture<Workouts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workouts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Workouts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initial workout signal should be null', () => {
    expect(component.workout()).toBeNull();
  });

  it('default date should look like local datetime', () => {
    expect(component.createDate()).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });
});
