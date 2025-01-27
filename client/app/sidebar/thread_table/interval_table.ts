//
// Copyright 2019 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
//
import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, ReplaySubject, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {Interval, ThreadInterval} from '../../models';
import {ColorService} from '../../services/color_service';
import * as Duration from '../../util/duration';

import {jumpToTime} from './jump_to_time';
import {SelectableTable} from './selectable_table';

/**
 * The EventTable displays thread intervals in an Angular 2 material table.
 */
@Component({
  selector: 'interval-table',
  styleUrls: ['thread_table.css'],
  templateUrl: 'interval_table.ng.html',
})
export class IntervalTable extends SelectableTable implements OnInit,
                                                              OnDestroy {
  @Input() jumpToTimeNs!: ReplaySubject<number>;
  private readonly unsub$ = new Subject<void>();

  filter = new BehaviorSubject<string>('');
  hideResults = false;

  private readonly filterPredicate =
      (data: Interval, filter: string): boolean => {
        if (!filter) {
          return true;
        }
        const pred = (data as ThreadInterval)
                         .threadStatesToString()
                         .toLowerCase()
                         .includes(filter.toLowerCase());
        return this.hideResults ? !pred : pred;
      };

  constructor(
      public colorService: ColorService, protected cdr: ChangeDetectorRef) {
    super(colorService, cdr);
    this.displayedColumns =
        ['cpu', 'state', 'startTimeNs', 'endTimeNs', 'duration'];
  }

  ngOnInit() {
    super.ngOnInit();
    if (!this.jumpToTimeNs) {
      throw new Error('Missing Observable for jump to time');
    }

    this.dataSource.filterPredicate = this.filterPredicate;

    this.jumpToTimeNs.pipe(takeUntil(this.unsub$)).subscribe((timeNs) => {
      jumpToTime(this.dataSource, timeNs);
    });

    this.filter.pipe(takeUntil(this.unsub$)).subscribe((filter: string) => {
      this.dataSource.filter = filter;
    });
    this.dataSource.sort!.sort(
        {id: 'startTimeNs', start: 'asc', disableClear: false});
  }

  ngOnDestroy() {
    this.unsub$.next();
    this.unsub$.complete();
  }

  /**
   * Helper method to format durations as trimmed, human readable strings.
   * @param durationNs the duration value in nanoseconds
   */
  formatTime(durationNs: number) {
    return Duration.getHumanReadableDurationFromNs(durationNs, 'ms');
  }

  /**
   *  Toggles whether the filter input is applied in inverse.
   */
  toggleFiltering() {
    this.hideResults = !this.hideResults;
    this.filter.next(this.filter.value);
  }

  /**
   * Clears the current filter input, given the input element.
   */
  clearFilter() {
    this.filter.next('');
  }
}
