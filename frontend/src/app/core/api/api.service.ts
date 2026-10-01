import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess } from '../models/api-response';

// The only place that talks to HttpClient. Feature services call this and get
// the unwrapped `data`, never the { success, data } envelope.
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string): Observable<T> {
    return this.http
      .get<ApiSuccess<T>>(`${environment.apiBaseUrl}${path}`)
      .pipe(map((res) => res.data));
  }
}
