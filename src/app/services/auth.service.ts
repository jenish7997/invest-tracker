import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, addDoc, query, where, getDocs, doc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_KEY = 'invest_tracker_auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router, private fs: Firestore) {
    // Check if user is already logged in
    const savedUser = localStorage.getItem(this.AUTH_KEY);
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      // Query users collection for matching email
      const usersRef = collection(this.fs, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: 'Invalid email or password' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;
      
      // Simple password check (in production, use proper hashing)
      if (userData.email === email.toLowerCase() && userData.isActive) {
        // For demo purposes, any password works for existing users
        // In production, implement proper password hashing
        
        const user: User = {
          ...userData,
          id: userDoc.id
        };

        // Store user data
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        return { success: true, user };
      } else {
        return { success: false, message: 'Account is inactive or invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  async register(userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if user already exists
      const usersRef = collection(this.fs, 'users');
      const q = query(usersRef, where('email', '==', userData.email.toLowerCase()));
      const existingUser = await getDocs(q);
      
      if (!existingUser.empty) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Create new user
      const newUser = {
        ...userData,
        email: userData.email.toLowerCase(),
        createdAt: new Date(),
        isActive: true
      };

      await addDoc(usersRef, newUser);
      return { success: true, message: 'User registered successfully' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  requireAuth(): boolean {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  // Create default admin user (call this once)
  async createDefaultAdmin(): Promise<void> {
    try {
      const adminData: Omit<User, 'id' | 'createdAt'> = {
        email: 'admin@investtracker.com',
        name: 'System Administrator',
        role: 'admin',
        isActive: true
      };

      const result = await this.register(adminData);
      if (result.success) {
        console.log('Default admin created successfully');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }
}