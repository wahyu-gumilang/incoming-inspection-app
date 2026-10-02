import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiSuccess, PageMeta } from '../models/api-response';
import { ApiError } from './api-error';

type Query = Record<string, string | number | boolean | null | undefined>;

export interface Page<T> {
  rows: T[];
  meta: PageMeta;
}

// The only place that talks to HttpClient. Feature services call this and get the
// unwrapped `data` (or an ApiError), never the { success, data } envelope.
// The session cookie travels automatically: /api is same-origin through the proxy.
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, query?: Query): Observable<T> {
    return this.unwrap(
      this.http.get<ApiSuccess<T>>(this.url(path), { params: this.params(query) }),
    );
  }

  page<T>(path: string, query?: Query): Observable<Page<T>> {
    return this.http.get<ApiSuccess<T[]>>(this.url(path), { params: this.params(query) }).pipe(
      map((res) => ({ rows: res.data, meta: res.meta as PageMeta })),
      catchError((err) => throwError(() => ApiError.from(err))),
    );
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.unwrap(this.http.post<ApiSuccess<T>>(this.url(path), body));
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.unwrap(this.http.put<ApiSuccess<T>>(this.url(path), body));
  }

  delete(path: string): Observable<void> {
    return this.http
      .delete<void>(this.url(path))
      .pipe(catchError((err) => throwError(() => ApiError.from(err))));
  }

  // A 204 (logout, delete) has no body at all.
  private unwrap<T>(request: Observable<ApiSuccess<T> | null>): Observable<T> {
    return request.pipe(
      map((res) => res?.data as T),
      catchError((err) => throwError(() => ApiError.from(err))),
    );
  }

  private url(path: string): string {
    return `${environment.apiBaseUrl}${path}`;
  }

  private params(query?: Query): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '')
        params = params.set(key, String(value));
    }
    return params;
  }
}
