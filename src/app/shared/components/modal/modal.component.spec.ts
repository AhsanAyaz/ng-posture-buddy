import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

import { ModalComponent } from "./modal.component";

describe("ModalComponent", () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatButtonModule],
      declarations: [ModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
