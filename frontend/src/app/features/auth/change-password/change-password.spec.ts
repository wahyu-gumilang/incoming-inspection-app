import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { fakeUser, signIn } from '../../../testing/users';
import { ChangePassword } from './change-password';

describe('ChangePassword', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'change-password', component: ChangePassword },
          { path: '**', children: [] },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    await signIn(TestBed.inject(AuthService), http, fakeUser({ must_change_password: true }));
  });

  afterEach(() => http.verify());

  async function open() {
    const harness = await RouterTestingHarness.create('/change-password');
    const el = harness.routeNativeElement as HTMLElement;
    const type = (name: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    };
    return { harness, el, type };
  }

  it('greets the user and checks the new password before sending it', async () => {
    const { harness, el, type } = await open();
    expect(el.textContent).toContain('Hi Wahyu');

    type('currentPassword', 'temp-pass');
    type('newPassword', 'short');
    type('confirm', 'different');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();

    http.expectNone('/api/auth/me/password');
    expect(el.textContent).toContain('Use at least 8 characters');
    expect(el.textContent).toContain('The two passwords are not the same');
  });

  it('saves the new password and opens the dashboard', async () => {
    const { el, type } = await open();
    type('currentPassword', 'temp-pass');
    type('newPassword', 'my-new-pass');
    type('confirm', 'my-new-pass');
    el.querySelector('form')!.dispatchEvent(new Event('submit'));

    http
      .expectOne('/api/auth/me/password')
      .flush({ success: true, data: fakeUser({ must_change_password: false }) });
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/dashboard'));
  });
});
