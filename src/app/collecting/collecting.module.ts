import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollectingRoutingModule } from './collecting-routing.module';

import { CollectingComponent } from './collecting.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [CollectingComponent],
  imports: [CommonModule, SharedModule, CollectingRoutingModule]
})
export class CollectingModule {}
