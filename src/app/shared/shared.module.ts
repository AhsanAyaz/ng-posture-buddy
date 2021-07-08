import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { TranslateModule } from "@ngx-translate/core";

import { PageNotFoundComponent } from "./components/";
import { WebviewDirective } from "./directives/";
import { FormsModule } from "@angular/forms";
import { ModalComponent } from "./components/modal/modal.component";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { HeaderComponent } from "./header/header.component";

@NgModule({
  declarations: [
    PageNotFoundComponent,
    WebviewDirective,
    ModalComponent,
    HeaderComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
  ],
  entryComponents: [ModalComponent],
  exports: [
    TranslateModule,
    WebviewDirective,
    FormsModule,
    ModalComponent,
    HeaderComponent,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
  ],
})
export class SharedModule {}
