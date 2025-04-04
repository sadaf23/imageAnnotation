import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AnnotationService } from '../annotation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeTrackerService } from '../time-tracker-service.service';
import { AuthService } from '../auth.service';

interface AnnotatedData {
  [key: string]: any;
}

@Component({
  selector: 'app-annotation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.css']
})
export class AnnotationComponent implements OnInit, AfterViewInit {
  
  jsonData: any = {};
  imageUrl: string = '';
  assignedJsonFile: string | null = null;
  assignedImageFile: string | null = null;
  currentIndex = 0;
  dataList: any[] = [];
  jsonKeyValues: { key: string; value: string }[] = [];
  username: string = '';
  annotatorId: string | null = null;
  progress: { annotated: number, total: number, remaining: number} = {
    annotated: 0,
    total: 0,
    remaining: 0,
  };
  severity: string = '';
  additionalDiagnosis: string = '';
  annotatedby: string = '';

  constructor(
    private authService: AuthService, 
    private annotationService: AnnotationService, 
    private http: HttpClient, 
    private timeTracker: TimeTrackerService
  ) {}

  ngOnInit() {
    console.log('Fetching Annotator ID from localStorage...');
    this.annotatorId = localStorage.getItem('annotatorId') || 'NOT SET';
    console.log('Fetched Annotator ID:', this.annotatorId);
    this.username = localStorage.getItem('username') || 'Guest';
    
    this.timeTracker.startSessionTracking();
    
    // Fetch annotator progress
    this.getAnnotatorProgress();
    
    // Fetch a random file for the annotator
    this.getRandomFileForAnnotator();

  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      const image = document.getElementById("zoomableImage") as HTMLImageElement;
      console.log('Image element:', image);
      if (image) {
        image.classList.remove("zoomed");

        image.addEventListener("click", () => {
          image.classList.toggle("zoomed");
        });
      }
    }, 0);
  }

  getAnnotatorProgress() {
    if (!this.annotatorId) {
      console.error('Annotator ID is not set.');
      return;
    }

    this.annotationService.getAnnotatorProgress(this.annotatorId).subscribe(
      (progress) => {
        console.log('Annotator progress:', progress);
        this.progress = progress;
      },
      (error) => {
        console.error('Error fetching annotator progress:', error);
      }
    );
  }

  getRandomFileForAnnotator() {
    if (!this.annotatorId) {
      console.error('Annotator ID is not set.');
      return;
    }

    this.annotationService.getRandomFile(this.annotatorId).subscribe(
      (response) => {
        console.log('Random file assigned:', response);
        
        if (response.jsonFiles && response.jsonFiles.length > 0 && 
            response.imageFiles && response.imageFiles.length > 0) {
          
          this.assignedJsonFile = response.jsonFiles[0];
          this.assignedImageFile = response.imageFiles[0];
          
          // Load the JSON data and image only if files are assigned
          if (this.assignedJsonFile && this.assignedImageFile) {
            this.loadJsonData(this.assignedJsonFile);
            this.loadImageUrl(this.assignedImageFile);
          }
        } else {
          console.warn('No files available for annotation.');
        }
      },
      (error) => {
        console.error('Error fetching random file:', error);
        if (error.status === 404) {
          // Handle case where no more files are available
          alert('No more files available for annotation. All files have been annotated by this annotator.');
        }
      }
    );
  }

  loadJsonData(filename: string) {
    const baseFilename = filename.split('/').pop();
    if (!baseFilename) {
      console.error('Invalid filename format');
      return;
    }

    this.annotationService.getJsonData(baseFilename).subscribe(
      (data) => {
        console.log('JSON data loaded:', data);
        this.jsonData = data;
        
        // Create key-value pairs for display
        this.jsonKeyValues = Object.entries(this.jsonData).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value)
        }));
      },
      (error) => {
        console.error('Error loading JSON data:', error);
      }
    );
  }

  loadImageUrl(filename: string) {
    const baseFilename = filename.split('/').pop();
    if (!baseFilename) {
      console.error('Invalid image filename format');
      return;
    }

    this.annotationService.getImageUrl(baseFilename).subscribe(
      (response) => {
        console.log('Image URL loaded:', response);
        this.imageUrl = response.imageUrl;
      },
      (error) => {
        console.error('Error loading image URL:', error);
      }
    );
  }

  saveAnnotation() {
    if (!this.jsonData || !this.assignedJsonFile || !this.annotatorId) {
      console.error('Missing data for saving annotation');
      return;
    }
  
    this.jsonData.severity = this.severity;
    this.jsonData.additionalDiagnosis = this.additionalDiagnosis;
    this.jsonData.annotatedby = this.username; // Store the annotator's username
  
    const baseFilename = this.assignedJsonFile.split('/').pop() || '';
    const annotatedFilename = baseFilename.replace('.json', '_annotated.json');
  
    console.log(`Saving annotation as: ${annotatedFilename} by annotator: ${this.username}`);
  
    this.annotationService.uploadJson(this.jsonData, `${encodeURIComponent(annotatedFilename)}?annotatorId=${this.annotatorId}`)
      .subscribe(
        (response) => {
          console.log('Annotation saved successfully:', response);
          
          // Track successful save only after confirmed success
          this.timeTracker.trackSuccessfulSave();
  
          this.severity = '';
          this.additionalDiagnosis = '';
  
          // Fetch updated progress only after a successful save
          this.getAnnotatorProgress();
  
          // Then load a new random file
          this.getRandomFileForAnnotator();
        },
        (error) => {
          console.error('Error saving annotation:', error);
          // No tracking increment on error
        }
      );
  }
  
  

  saveAndNext() {
    // this.timeTracker.trackSaveNextClick();
    this.saveAnnotation();
  }

  duplicateText(field: string, value: string) {
    if (field) {
      this.jsonData[field] = value;
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event) {
    this.timeTracker.stopSessionTracking();
  }

  logout() {
    console.log('Logout button clicked');
    this.timeTracker.stopSessionTracking();
    this.authService.logout();
  }
}