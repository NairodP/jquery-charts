import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mainContent') private readonly mainContent?: ElementRef<HTMLElement>;

  showSidebar: boolean;

  private readonly navigationSubscription: Subscription;

  constructor(private readonly router: Router) {
    this.showSidebar = this.shouldShowSidebar(this.router.url);
    this.navigationSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.showSidebar = this.shouldShowSidebar(event.urlAfterRedirects);
        this.scrollMainToTop();
      });
  }

  ngAfterViewInit(): void {
    this.scrollMainToTop();
  }

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  private shouldShowSidebar(url: string): boolean {
    const path = url.split(/[?#]/)[0] || '/';
    return path !== '/';
  }

  private scrollMainToTop(): void {
    this.mainContent?.nativeElement.scrollTo({ top: 0, left: 0 });
  }
}
