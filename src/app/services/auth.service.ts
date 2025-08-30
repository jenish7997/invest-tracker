import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ADMIN_USERNAME = 'jenish7997';
  private readonly ADMIN_PASSWORD = 'Jenish20@';
  private readonly AUTH_KEY = 'invest_tracker_auth';

  constructor(private router: Router) {}

  login(username: string, password: string): boolean {
    if (username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
      // Store authentication in memory (for session only)
      sessionStorage.setItem(this.AUTH_KEY, 'authenticated');
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(this.AUTH_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem(this.AUTH_KEY) === 'authenticated';
  }

  // Method to check authentication and redirect if needed
  requireAuth(): boolean {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}