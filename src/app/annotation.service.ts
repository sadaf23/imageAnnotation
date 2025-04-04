import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';  // Import Observable

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {
  private backendUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  getFiles(): Observable<any> {
    return this.http.get(`${this.backendUrl}/data`);
  }

  getJsonData(filename: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/json/${filename}`);
  }

  getImageUrl(filename: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/image/${filename}`);
  }

  uploadJson(fileData: any, filename: string): Observable<any> {
    const url = `${this.backendUrl}/upload/${filename}`;
    return this.http.put(url, fileData);
  }

  getRandomFile(annotatorId: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/data/random/${annotatorId}`);
  }

  // Get annotator progress
  getAnnotatorProgress(annotatorId: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/annotator/progress/${annotatorId}`);
  }

  getNewJsonFiles() {
    return this.http.get('/data/new-json');
  }
  
  // Method to get a specific JSON file from the new folder
  getNewJsonData(filename: string) {
    return this.http.get(`/json/new/${filename}`);
  }
}
