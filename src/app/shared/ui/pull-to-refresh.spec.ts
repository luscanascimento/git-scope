import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';

import { PullToRefresh } from './pull-to-refresh';

/**
 * The leak being guarded against: the 6s auto-retract safety net used to be
 * scheduled on every completed pull and never cleared, so rapid pulls stacked
 * timers that outlived both `done()` and component destruction.
 *
 * `flush()` returns the virtual milliseconds it had to advance to drain the
 * timer queue, so `expect(flush()).toBe(0)` asserts "nothing is still pending".
 */
describe('PullToRefresh', () => {
  let fixture: ComponentFixture<PullToRefresh>;
  let host: HTMLElement;
  let refreshes: number;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PullToRefresh] });
    fixture = TestBed.createComponent(PullToRefresh);
    host = fixture.nativeElement as HTMLElement;
    refreshes = 0;
    fixture.componentInstance.refresh.subscribe(() => refreshes++);
    fixture.detectChanges();
  });

  function touch(type: string, clientY: number): void {
    const point = new Touch({ identifier: 0, target: host, clientX: 0, clientY });
    host.dispatchEvent(new TouchEvent(type, { touches: [point], bubbles: true }));
  }

  /** A full downward pull past the arm threshold. */
  function pull(): void {
    touch('touchstart', 0);
    touch('touchmove', 200);
    touch('touchend', 200);
  }

  it('emits refresh once per completed pull', fakeAsync(() => {
    pull();
    expect(refreshes).toBe(1);
    fixture.componentInstance.done();
    expect(flush()).toBe(0);
  }));

  it('clears the auto-retract timer when done() runs', fakeAsync(() => {
    pull();
    fixture.componentInstance.done();
    expect(flush()).toBe(0);
  }));

  it('does not stack auto-retract timers across repeated pulls', fakeAsync(() => {
    for (let i = 0; i < 3; i++) {
      pull();
      fixture.componentInstance.done();
    }
    expect(refreshes).toBe(3);
    expect(flush()).toBe(0);
  }));

  it('clears the auto-retract timer on destroy', fakeAsync(() => {
    pull();
    fixture.destroy();
    expect(flush()).toBe(0);
  }));
});
