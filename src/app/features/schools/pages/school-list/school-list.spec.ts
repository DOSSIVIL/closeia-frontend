import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchoolList } from './school-list';

describe('SchoolList', () => {
  let component: SchoolList;
  let fixture: ComponentFixture<SchoolList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolList],
    }).compileComponents();

    fixture = TestBed.createComponent(SchoolList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
