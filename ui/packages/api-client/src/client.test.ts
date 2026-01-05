import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, ApiError } from './client';

describe('ApiClient', () => {
  beforeEach(() => {
    apiClient.configure({
      baseUrl: 'http://localhost:3000/api',
      getAuthToken: undefined,
    });
  });

  describe('configure', () => {
    it('should update baseUrl', () => {
      apiClient.configure({ baseUrl: 'https://api.example.com' });
      expect(apiClient.getConfig().baseUrl).toBe('https://api.example.com');
    });

    it('should update auth token function', () => {
      const getToken = () => 'test-token';
      apiClient.configure({ getAuthToken: getToken });
      expect(apiClient.getConfig().getAuthToken).toBe(getToken);
    });
  });

  describe('buildUrl', () => {
    it('should build URL without params', () => {
      const url = apiClient.buildUrl('/users');
      expect(url).toBe('http://localhost:3000/api/users');
    });

    it('should build URL with params', () => {
      const url = apiClient.buildUrl('/users', { page: 1, limit: 10 });
      expect(url).toBe('http://localhost:3000/api/users?page=1&limit=10');
    });

    it('should skip undefined params', () => {
      const url = apiClient.buildUrl('/users', { page: 1, limit: undefined });
      expect(url).toBe('http://localhost:3000/api/users?page=1');
    });

    it('should handle boolean params', () => {
      const url = apiClient.buildUrl('/users', { active: true });
      expect(url).toBe('http://localhost:3000/api/users?active=true');
    });
  });

  describe('getHeaders', () => {
    it('should include Content-Type header', () => {
      const headers = apiClient.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not include Authorization without token', () => {
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should include Authorization with token', () => {
      apiClient.configure({ getAuthToken: () => 'my-token' });
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBe('Bearer my-token');
    });

    it('should not include Authorization when token is null', () => {
      apiClient.configure({ getAuthToken: () => null });
      const headers = apiClient.getHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });
  });
});

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError('NOT_FOUND', 'User not found', 404, { userId: '123' });
    
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
    expect(error.status).toBe(404);
    expect(error.details).toEqual({ userId: '123' });
    expect(error.name).toBe('ApiError');
  });

  it('should be instance of Error', () => {
    const error = new ApiError('ERROR', 'test', 500);
    expect(error).toBeInstanceOf(Error);
  });
});
