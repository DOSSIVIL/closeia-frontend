import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchoolForm } from './school-form';

describe('SchoolForm', () => {
  let component: SchoolForm;
  let fixture: ComponentFixture<SchoolForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolForm],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
