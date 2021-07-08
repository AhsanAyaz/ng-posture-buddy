import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { TranslateModule } from "@ngx-translate/core";
import { SharedModule } from "../shared/shared.module";
import { CollectingComponent } from "./collecting.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
jest.mock('./../../assets/ml5.min.js', ()=>(jest.fn()));

describe("CollectingComponent", () => {
  let component: CollectingComponent;
  let fixture: ComponentFixture<CollectingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectingComponent],
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule,
        SharedModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
