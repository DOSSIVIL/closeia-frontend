import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Auth } from '../../../../core/auth/auth';
import { RolesService } from '../../services/roles.service';
import { RoleList } from './role-list';

describe('RoleList', () => {
  let component: RoleList;
  let fixture: ComponentFixture<RoleList>;

  beforeEach(async () => {
    const rolesApi = {
      list: () => of({ data: [], permissions: [], documentScopes: [] }),
      create: () => of({}),
      update: () => of({}),
    };

    await TestBed.configureTestingModule({
      imports: [RoleList],
      providers: [
        { provide: RolesService, useValue: rolesApi },
        { provide: Auth, useValue: { hasPermission: () => true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
