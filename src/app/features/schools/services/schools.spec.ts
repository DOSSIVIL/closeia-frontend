import { TestBed } from '@angular/core/testing';
import { Schools } from './schools';

describe('Schools', () => {
  let service: Schools;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Schools);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
