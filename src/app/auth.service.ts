import { Injectable } from '@angular/core';
import { TimeTrackerService } from './time-tracker-service.service'; // ✅ Import service

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private startTime: number = 0;
  private totalTimeSpent: number = 0;

  private users = [
    { username: "annotator1", password: "pass123", annotatorId: "annotator_1"  },
    { username: "annotator2", password: "annot234", annotatorId: "annotator_2"  },
    { username: "annotator3", password: "annot345", annotatorId: "annotator_3" },
    { username: "prn_annotator", password: "prnannot654", annotatorId: "prn_annotator"  },
    { username: "admin", password: "admin123" ,annotatorId: "admin" }
  ];
  private isAuthenticated = false;

  constructor(private timeTracker: TimeTrackerService) {} // ✅ Inject TimeTrackerService

  login(username: string, password: string): boolean {
   
    const user = this.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      this.isAuthenticated = true;
      this.startTime = Date.now();
  
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loginTime', this.startTime.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('annotatorId', user.annotatorId); // ✅ Ensure `annotatorId` is stored
  
      console.log('Stored in localStorage:', {
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        loginTime: localStorage.getItem('loginTime'),
        username: localStorage.getItem('username'),
        annotatorId: localStorage.getItem('annotatorId'), // ✅ Debug log
      });
  
      this.timeTracker.startSessionTracking(); 
      return true;
    }
    return false;
  }
  
  
  

  logout() {
    if (!this.isAuthenticated) return;
  
    const endTime = Date.now();
    this.totalTimeSpent += (endTime - this.startTime) / 1000;
    console.log(`Total Time Online: ${this.totalTimeSpent} seconds`);
  
    this.timeTracker.stopSessionTracking(); // ✅ Trigger CSV creation
  
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('username');
    localStorage.removeItem('annotatorId'); // ✅ Remove annotatorId
  
    this.isAuthenticated = false;
    this.startTime = 0;
  }
  

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
}
