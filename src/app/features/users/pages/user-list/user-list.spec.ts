import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Auth } from '../../../../core/auth/auth';
import { EtablissementsService } from '../../../etablissements/services/etablissements.service';
import { UserList } from './user-list';
import { UsersService } from '../../services/users.service';

describe('UserList', () => {
  let component: UserList;
  let fixture: ComponentFixture<UserList>;

  beforeEach(async () => {
    const usersApi = {
      listAssignableRoles: () => of([{ code: 'GUEST', name: 'Invité', description: null }]),
      list: () =>
        of({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
          stats: { total: 0, active: 0, invited: 0, suspended: 0 },
        }),
      create: () => of({}),
      update: () => of({}),
      setStatus: () => of({}),
      remove: () => of(undefined),
    };
    const schoolsApi = {
      list: () => of({ data: [], meta: { total: 0, page: 1, limit: 100, totalPages: 1 } }),
    };

    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [
        { provide: UsersService, useValue: usersApi },
        { provide: EtablissementsService, useValue: schoolsApi },
        {
          provide: Auth,
          useValue: {
            hasPermission: () => true,
            user: () => ({ id: 'admin', roles: ['PLATFORM_ADMIN'], schoolId: null }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
