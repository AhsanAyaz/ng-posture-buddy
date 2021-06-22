import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { CollectingComponent } from './collecting.component';

const routes: Routes = [
  {
    path: 'collecting',
    component: CollectingComponent
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CollectingRoutingModule {}
