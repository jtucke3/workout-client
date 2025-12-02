import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendProfile } from './friend-profile';

describe('FriendProfile', () => {
  let component: FriendProfile;
  let fixture: ComponentFixture<FriendProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
