import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackerService {
  private sessionStartTime: number | null = null;
  private lastClickTime: number | null = null;
  private totalClicks = 0;
  private annotationTimes: number[] = [];

  constructor(private http: HttpClient) {}

  startSessionTracking() {
    if (this.sessionStartTime) return;  // Prevent reinitialization

    this.sessionStartTime = Date.now();
    this.lastClickTime = this.sessionStartTime;

    const storedClicks = parseInt(localStorage.getItem('totalClicks') || '0', 10);
    this.totalClicks = storedClicks;

    localStorage.setItem('sessionStart', this.sessionStartTime.toString());
    localStorage.setItem('totalClicks', this.totalClicks.toString());

    console.log('Session started at:', this.formatDateTime(this.sessionStartTime));
    console.log('Total Clicks at session start:', this.totalClicks);
  }

  // This will be used after a successful save operation
  trackSuccessfulSave() {
    console.log('Before increment:', this.totalClicks);
    this.totalClicks++;
    console.log('After increment:', this.totalClicks);

    localStorage.setItem('totalClicks', this.totalClicks.toString()); // Persist clicks

    if (this.lastClickTime) {
      const timeSpent = (Date.now() - this.lastClickTime) / 1000;
      this.annotationTimes.push(timeSpent);
      this.lastClickTime = Date.now();
    }
    
    console.log('Successfully tracked save operation, new count:', this.totalClicks);
  }

  // Keep this method for backward compatibility
  // but make it do nothing to prevent duplicate counting
  trackSaveNextClick() {
    console.log('trackSaveNextClick called but skipping counter increment. Use trackSuccessfulSave instead.');
    // No longer incrementing click count here
  }

  stopSessionTracking() {
    console.log('stopSessionTracking() called');

    const sessionEndTime = Date.now();
    const sessionDuration = (sessionEndTime - (this.sessionStartTime || sessionEndTime)) / 1000;
    const username = localStorage.getItem('username') || 'Unknown';

    console.log('Session duration:', sessionDuration, 'seconds');

    const averageAnnotationTime = this.annotationTimes.length 
      ? (this.annotationTimes.reduce((a, b) => a + b, 0) / this.annotationTimes.length).toFixed(2) 
      : "N/A";

    // Format login and logout times
    const formattedStartTime = this.formatDateTime(this.sessionStartTime!);
    const formattedEndTime = this.formatDateTime(sessionEndTime);

    const csvData = `Username,Login,Logout,Annotation Count,Avg Time Per Annotation (sec)\n` +
                    `${username},${formattedStartTime},${formattedEndTime},${this.totalClicks},${averageAnnotationTime}\n`;

    console.log('CSV Data:', csvData);

    this.uploadToGoogleCloud(csvData, username);

    // Clear session data
    localStorage.removeItem('sessionStart');
    localStorage.removeItem('totalClicks');
    localStorage.removeItem('username');
  }

  uploadToGoogleCloud(csvData: string, username: string) {
    const backendUrl = 'http://localhost:5000/upload-tracking';
    
    // Add timestamp to filename to make it unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${username}_tracking_${timestamp}.csv`;

    const requestBody = {
      username: username,
      csv: csvData,
      filename: filename
    };

    this.http.post(backendUrl, requestBody, { responseType: 'json' }).subscribe(
      response => console.log('Tracking data uploaded successfully:', response),
      error => console.error('Error uploading tracking data:', error)
    );   
  }

  // Helper function to format date as dd-MM-yyyy HH:mm
  private formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: false 
    }).replace(',', '');
  }
}