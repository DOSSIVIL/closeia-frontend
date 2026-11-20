import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardSummary } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const summary: DashboardSummary = {
    generatedAt: '2026-11-20T09:00:00.000Z',
    scope: 'platform',
    users: {
      total: 14,
      active: 10,
      invited: 3,
      suspended: 1,
      monthlyRegistrations: [
        { month: '2026-06', count: 1 },
        { month: '2026-07', count: 2 },
        { month: '2026-08', count: 0 },
        { month: '2026-09', count: 3 },
        { month: '2026-10', count: 4 },
        { month: '2026-11', count: 4 },
      ],
    },
    schools: {
      total: 2,
      active: 1,
      inactive: 1,
      recent: [
        {
          id: 'school-1',
          name: 'Établissement test',
          city: 'Douala',
          active: true,
          createdAt: '2026-11-01T00:00:00.000Z',
          userCount: 14,
        },
      ],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        {
          provide: DashboardService,
          useValue: {
            getSummary: () => of(summary),
            exportExcel: () => of(new Blob()),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders metrics and recent establishments from the API response', () => {
    expect(fixture.nativeElement.textContent).toContain('14');
    expect(fixture.nativeElement.textContent).toContain('Établissement test');
    expect(component.metrics().map((metric) => metric.value)).toEqual([2, 14, 10, 3]);
  });

  it('builds the registration chart from the returned monthly values', () => {
    expect(component.chartCoordinates().map((point) => point.count)).toEqual([1, 2, 0, 3, 4, 4]);
    expect(component.chartLine()).toContain(',');
    expect(component.statusBreakdown().map((item) => item.value)).toEqual([10, 3, 1]);
  });
});
