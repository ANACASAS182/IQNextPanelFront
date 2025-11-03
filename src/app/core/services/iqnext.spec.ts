import { TestBed } from '@angular/core/testing';

import { Iqnext } from './iqnext';

describe('Iqnext', () => {
  let service: Iqnext;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Iqnext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
