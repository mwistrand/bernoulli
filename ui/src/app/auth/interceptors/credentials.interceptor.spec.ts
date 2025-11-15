import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandler } from '@angular/common/http';
import { credentialsInterceptor } from './credentials.interceptor';

describe('credentialsInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => credentialsInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should clone the request with withCredentials set to true', () => {
    const mockRequest = new HttpRequest('GET', '/api/test');
    const mockNext: HttpHandler = {
      handle: jasmine.createSpy('handle'),
    };

    interceptor(mockRequest, mockNext.handle);

    expect(mockNext.handle).toHaveBeenCalledWith(
      jasmine.objectContaining({
        withCredentials: true,
      }),
    );
  });

  it('should preserve original request properties', () => {
    const mockRequest = new HttpRequest('POST', '/api/test', { data: 'test' });
    const mockNext: HttpHandler = {
      handle: jasmine.createSpy('handle'),
    };

    interceptor(mockRequest, mockNext.handle);

    const callArgs = (mockNext.handle as jasmine.Spy).calls.mostRecent().args[0];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.url).toBe('/api/test');
    expect(callArgs.withCredentials).toBe(true);
  });
});
