import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface VideoDialogData {
  titulo: string;
  youtubeId: string;
  preview?: boolean;
}

@Component({
  selector: 'app-video-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './video-dialog.html',
  styleUrl: './video-dialog.scss',
})
export class VideoDialog {
  readonly data: VideoDialogData = inject(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);

  get preview(): boolean {
    return !!this.data.preview;
  }

  get videoUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${this.data.youtubeId}?autoplay=1`,
    );
  }
}
