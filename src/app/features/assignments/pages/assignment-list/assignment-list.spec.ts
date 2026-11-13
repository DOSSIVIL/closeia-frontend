import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Auth } from '../../../../core/auth/auth';
import { EtablissementsService } from '../../../etablissements/services/etablissements.service';
import { UsersService } from '../../../users/services/users.service';
import { AssignmentList } from './assignment-list';
import { AssignmentsService } from '../../services/assignments.service';

describe('AssignmentList', () => {
  let component: AssignmentList;
  let fixture: ComponentFixture<AssignmentList>;

  beforeEach(async () => {
    const assignmentsApi = {
      list: () =>
        of({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
          stats: { total: 0, schoolAdmins: 0, staff: 0, students: 0, guests: 0 },
        }),
      listRoles: () => of([]),
      create: () => of({}),
      remove: () => of(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [AssignmentList],
      providers: [
        { provide: AssignmentsService, useValue: assignmentsApi },
        {
          provide: UsersService,
          useValue: { list: () => of({ data: [], meta: {}, stats: {} }) },
        },
        {
          provide: EtablissementsService,
          useValue: { list: () => of({ data: [], meta: {} }) },
        },
        {
          provide: Auth,
          useValue: {
            hasPermission: () => true,
            user: () => ({ id: 'admin', roles: ['PLATFORM_ADMIN'], schoolId: null }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
